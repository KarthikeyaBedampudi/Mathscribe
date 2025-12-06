# Project: Handwritten Math OCR + Solver

Purpose: convert stylus-drawn math on a browser canvas into text using a TrOCR model, then resolve the expression via Gemini. Frontend supplies a large drawing surface but rescales to 384×384 for the model. Backend exposes two routes: /predict for OCR and /solve for Gemini inference. Output includes raw OCR text and the computed solution.

Scope: pure local OCR, external LLM only for solving. Model runs once at startup. Interaction between stages is explicit: canvas → OCR → HTML → Gemini.

# Key points:

* canvas API used only for drawing and PNG extraction
* fixed 384×384 model input
* stylus enabled via pointer events
* clean separation of concerns between OCR and solving
* FastAPI server with two POST endpoints
* Gemini call implemented according to current Google AI Studio API format
