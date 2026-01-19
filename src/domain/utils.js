export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
