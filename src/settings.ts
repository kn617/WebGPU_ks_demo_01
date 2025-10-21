const selectShape = document.getElementById('shape') as HTMLSelectElement;
const segments = document.getElementById('segments') as HTMLInputElement;

selectShape.addEventListener('change', () => {
  localStorage.setItem('shape', selectShape.value);
});

segments.addEventListener('input', () => {
  localStorage.setItem('segments', segments.value);
});

// initialize from saved values
const savedShape = localStorage.getItem('shape');
if (savedShape) selectShape.value = savedShape;
const savedSeg = localStorage.getItem('segments');
if (savedSeg) segments.value = savedSeg;
