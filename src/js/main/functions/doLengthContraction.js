function doLengthContraction(x, y, z, ux, uy, uz) {
  const beta = Math.sqrt(ux * ux + uy * uy + uz * uz) / c;
  if (beta == 0) {
    return [x, y, z];
  }
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  const factor = 1 / gamma - 1;
  const px = ux / Math.sqrt(ux * ux + uy * uy + uz * uz);
  const py = uy / Math.sqrt(ux * ux + uy * uy + uz * uz);
  const pz = uz / Math.sqrt(ux * ux + uy * uy + uz * uz);
  const xprime =
    (1 + factor * px * px) * x + factor * px * py * y + factor * px * pz * z;
  const yprime =
    factor * px * py * x + (1 + factor * py * py) * y + factor * py * pz * z;
  const zprime =
    factor * px * pz * x + factor * py * pz * y + (1 + factor * pz * pz) * z;
  return [xprime, yprime, zprime];
}

export default doLengthContraction;
