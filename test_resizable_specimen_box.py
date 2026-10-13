import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

workspace_dir = r"c:\Users\user\Downloads\deploy-6a992c0f2df4500008756bf1"
html_path = os.path.join(workspace_dir, "surakshya-bhatta-sifarish.html")
js_path = os.path.join(workspace_dir, "script-surakshya-bhatta-sifarish.js")

def test_html_specimen_controls():
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Section Title
    assert "नमुना दस्तखतको Box मिलाउने" in content, "Control section header missing!"
    print("PASS: Section header 'नमुना दस्तखतको Box मिलाउने' present.")

    # 2. Four Controls
    assert "sliderSigWidth" in content and "numSigWidth" in content, "Width controls missing!"
    assert "sliderSigHeight" in content and "numSigHeight" in content, "Height controls missing!"
    assert "sliderSigPosX" in content and "numSigPosX" in content, "Horizontal PosX controls missing!"
    assert "sliderSigPosY" in content and "numSigPosY" in content, "Vertical PosY controls missing!"
    print("PASS: All 4 dimension & position controls present.")

    # 3. Action Buttons
    assert "resetSpecimenBoxLayout()" in content, "Reset button function call missing!"
    assert "पूर्वनिर्धारित अवस्थामा फर्काउने" in content, "Reset button Nepali label missing!"
    assert "scrollToPreviewSpecimenBox()" in content, "Preview button function call missing!"
    assert "Preview मा हेर्ने" in content, "Preview button Nepali label missing!"
    print("PASS: Reset and Preview buttons present.")

    # 4. Preview Elements
    assert 'id="specimenSigCard"' in content, "Specimen card element missing!"
    assert 'id="specimenSigBox"' in content, "Specimen inner box element missing!"
    assert 'class="specimen-signature-container"' in content, "Specimen container missing!"
    print("PASS: Preview specimen box elements present.")

    # 5. Tapasil Left Alignment
    assert 'text-align: left;' in content, "Tapasil alignment broken!"
    assert 'margin-left: 0;' in content or 'margin-left: 0 !important;' in content, "Tapasil left alignment broken!"
    print("PASS: Tapasil left alignment preserved.")

def test_js_logic_and_persistence():
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Default Layout & Limits
    assert "DEFAULT_SPECIMEN_BOX_LAYOUT" in content, "DEFAULT_SPECIMEN_BOX_LAYOUT constant missing!"
    assert "width: 48" in content and "height: 13" in content, "Default dimensions not 48mm x 13mm!"
    assert "posX: 0" in content and "posY: 0" in content, "Default offsets not 0mm, 0mm!"
    print("PASS: DEFAULT_SPECIMEN_BOX_LAYOUT configured correctly.")

    # 2. Key controller functions
    for func in [
        "validateSpecimenDimensions",
        "applySpecimenBoxLayout",
        "onSigBoxLayoutSlider",
        "onSigBoxLayoutInput",
        "resetSpecimenBoxLayout",
        "scrollToPreviewSpecimenBox",
        "loadStoredSpecimenBoxLayout",
        "initSpecimenBoxDraggable"
    ]:
        assert f"function {func}" in content, f"Function {func} missing from JS!"
        print(f"PASS: Controller function {func} implemented.")

    # 3. Persistence in printAndSaveSystem
    assert "specimenSigWidth:     currentSpecimenBoxLayout.width" in content, "Width not saved in Firestore record!"
    assert "specimenSigHeight:    currentSpecimenBoxLayout.height" in content, "Height not saved in Firestore record!"
    assert "specimenSigPosX:      currentSpecimenBoxLayout.posX" in content, "PosX not saved in Firestore record!"
    assert "specimenSigPosY:      currentSpecimenBoxLayout.posY" in content, "PosY not saved in Firestore record!"
    print("PASS: printAndSaveSystem persists specimen box dimensions and positions.")

    # 4. Restoration in loadRecordToForm
    load_section = content[content.find("function loadRecordToForm"):content.find("function deleteRecord")]
    assert "applySpecimenBoxLayout" in load_section, "loadRecordToForm does not restore specimen layout!"
    assert "loadStoredSpecimenBoxLayout" in load_section, "loadRecordToForm fallback missing!"
    print("PASS: loadRecordToForm restores saved specimen layout with graceful fallback.")

    # 5. Restoration in applyQuarterlyUpdate
    quarterly_section = content[content.find("function applyQuarterlyUpdate"):content.find("function updateGuardianSuggestions")]
    assert "applySpecimenBoxLayout" in quarterly_section, "applyQuarterlyUpdate does not restore specimen layout!"
    print("PASS: applyQuarterlyUpdate restores saved specimen layout.")

    # 6. ResetForm resets specimen box
    reset_section = content[content.find("function resetForm()"):content.find("function toggleModal")]
    assert "loadStoredSpecimenBoxLayout" in reset_section, "resetForm does not reset specimen box!"
    print("PASS: resetForm resets specimen box.")

    # 7. Drag listener & Bootstrap init
    assert "initSpecimenBoxDraggable" in content, "initSpecimenBoxDraggable missing!"
    assert "loadStoredSpecimenBoxLayout();" in content, "loadStoredSpecimenBoxLayout call missing!"
    print("PASS: Drag listener and bootstrap init hooked.")

def test_scope_safety():
    other_html_files = [
        f for f in os.listdir(workspace_dir)
        if f.endswith(".html") and f != "surakshya-bhatta-sifarish.html"
    ]
    for filename in other_html_files:
        filepath = os.path.join(workspace_dir, filename)
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            data = f.read()
        assert "specimenBoxControlsCard" not in data, f"Contamination in {filename}!"
        assert "नमुना दस्तखतको Box मिलाउने" not in data, f"Contamination in {filename}!"
    print(f"PASS: Scope strictly isolated across all {len(other_html_files)} other HTML templates.")

if __name__ == "__main__":
    test_html_specimen_controls()
    test_js_logic_and_persistence()
    test_scope_safety()
    print("\nALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")
