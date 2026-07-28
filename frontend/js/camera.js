const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const preview = document.getElementById("photoPreview");
const takePhotoBtn = document.getElementById("takePhotoBtn");
const retakePhotoBtn = document.getElementById("retakePhotoBtn");
const captureDetails = document.getElementById("captureDetails");

let stream = null;

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

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL("image/png");
    if (preview) {
      preview.src = image;
      preview.style.display = "block";
    }

    if (retakePhotoBtn) {
      retakePhotoBtn.style.display = "inline-flex";
    }

    if (captureDetails) {
      captureDetails.style.display = "block";
    }

    window.dispatchEvent(
      new CustomEvent("photocaptured", {
        detail: { image },
      })
    );

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
  });
}
