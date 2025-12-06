const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const resultDiv = document.getElementById("result");
const solutionDiv = document.getElementById("solution");
let drawing = false;

// Setup canvas
ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.strokeStyle = "white";
ctx.lineWidth = 8;
ctx.lineCap = "round";

// --- Universal Pointer Events (works for mouse, touch, stylus)
canvas.addEventListener("pointerdown", (e) => {
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    
    // Scale coordinates for responsive canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    ctx.beginPath();
    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
});

canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();

    // Scale coordinates for responsive canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    ctx.stroke();
});

canvas.addEventListener("pointerup", () => drawing = false);
canvas.addEventListener("pointerleave", () => drawing = false);

document.getElementById("clearBtn").addEventListener("click", () => {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    resultDiv.textContent = "";
    solutionDiv.textContent = "";
});

document.getElementById("submitBtn").addEventListener("click", async () => {
    resultDiv.textContent = "Processing...";
    solutionDiv.textContent = "";

    // 🧩 Resize to 384x384 before sending to backend
    const offscreen = document.createElement("canvas");
    offscreen.width = 384;
    offscreen.height = 384;
    const offCtx = offscreen.getContext("2d");
    offCtx.drawImage(canvas, 0, 0, 384, 384);
    const dataURL = offscreen.toDataURL("image/png");

    try {
        // Phase 1: OCR
        const response = await fetch("/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: dataURL })
        });

        const data = await response.json();
        if (response.ok) {
            resultDiv.textContent = data.text; // Just show the text

            // Phase 2: Send OCR result to Gemini for solution
            const solResponse = await fetch("/solve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ expression: data.text })
            });

            const solData = await solResponse.json();
            if (solResponse.ok) {
                solutionDiv.textContent = solData.answer; // Just show the answer
            } else {
                solutionDiv.textContent = "Error in solving: " + solData.error;
            }

        } else {
            resultDiv.textContent = "Error: " + data.error;
        }
    } catch (err) {
        resultDiv.textContent = "Error: " + err;
    }
});