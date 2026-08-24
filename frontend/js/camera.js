const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const preview = document.getElementById("photoPreview");
const takePhotoBtn = document.getElementById("takePhotoBtn");
const retakePhotoBtn = document.getElementById("retakePhotoBtn");
const captureDetails = document.getElementById("captureDetails");

let stream = null;

// Phone cameras give us about 4000px wide. 1600px is plenty for a report photo
// and keeps the upload down to a few hundred KB instead of several MB.
const MAX_PHOTO_WIDTH = 1600;

export async function openCamera() {
  if (!video) return;
  if (stream) return;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });

    video.srcObject = stream;
    await video.play();
    // Bring the live view back, since taking a photo hides it.
    video.style.display = "block";
  } catch (err) {
    alert("Unable to access camera.");
    console.error(err);
  }
}

export function closeCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  if (video) {
    video.srcObject = null;
    video.style.display = "block";
  }

  if (preview) {
    preview.style.display = "none";
  }

  if (captureDetails) {
    captureDetails.style.display = "none";
  }
}

if (takePhotoBtn) {
  takePhotoBtn.addEventListener("click", () => {
    if (!stream || !video || !canvas) return;

    // Shrink the photo before we do anything else, keeping the aspect ratio.
    const scale = Math.min(1, MAX_PHOTO_WIDTH / video.videoWidth);
    const ctx = canvas.getContext("2d");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // toBlob gives us a real file to upload to Cloud Storage. The old
    // toDataURL version handed back a base64 string, which was only useful
    // back when photos were being stuffed into local storage.
    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const previewUrl = URL.createObjectURL(blob);
        if (preview) {
          preview.src = previewUrl;
          preview.style.display = "block";
        }

        // The video and the preview are siblings in the camera stage and the
        // stylesheet keeps both as display:block, so a stopped video would sit
        // on top of the photo as a black box. Hide it once we have the still.
        video.style.display = "none";

        if (retakePhotoBtn) {
          retakePhotoBtn.style.display = "inline-flex";
        }

        if (captureDetails) {
          captureDetails.style.display = "block";
        }

        window.dispatchEvent(
          new CustomEvent("photocaptured", {
            detail: { blob, previewUrl },
          })
        );

        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          stream = null;
        }
      },
      "image/jpeg",
      0.8
    );
  });
}
