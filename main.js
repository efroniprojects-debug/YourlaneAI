const totalSteps = 30; // שנה לפי מספר השלבים בפועל
let currentStep = 1;

function showStep(step) {
  for (let i = 1; i <= totalSteps; i++) {
    document.getElementById('step'+i)?.style && (document.getElementById('step'+i).style.display = (i === step ? 'block' : 'none'));
  }
  document.getElementById('prevBtn').style.display = (step > 1) ? 'inline-block' : 'none';
  document.getElementById('nextBtn').textContent = (step === totalSteps) ? 'סיום' : 'הבא';
  document.getElementById('progress').style.width = (step/totalSteps*100) + '%';
}

document.getElementById('nextBtn').addEventListener('click', function() {
  if(currentStep < totalSteps){
    // אופציונלי: ולידציה ידנית בין השלבים
    showStep(++currentStep);
  } else {
    document.getElementById('diagnosisForm').submit(); // אופציונלי - טיפול בהגשה
  }
});

document.getElementById('prevBtn').addEventListener('click', function() {
  if(currentStep > 1){
    showStep(--currentStep);
  }
});

// התחלה
showStep(currentStep);
