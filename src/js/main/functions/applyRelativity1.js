function applyRelativity1(x0, y0, z0, vx, vy, vz, ux, uy, uz, tb) {
  const v = Math.sqrt(vx * vx + vy * vy + vz * vz);
  const beta = v / c;
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  const betau = Math.sqrt(ux * ux + uy * uy + uz * uz) / c;
  const gammau = 1 / Math.sqrt(1 - betau * betau);
  const ta =
    (gamma * c * c * tb + vx * x0 + vy * y0 + vz * z0) /
    (c * c - ux * vx - uy * vy - uz * vz);

  const xprime = x0 + ux * ta;
  const yprime = y0 + uy * ta;
  const zprime = z0 + uz * ta;

  const tobj = ta / gammau - (gammau * (ux * x0 + uy * y0 + uz * z0)) / (c * c);

  if (v == 0) {
    return [xprime, yprime, zprime, tobj];
  }

  const factor = gamma - 1;
  const px = vx / v;
  const py = vy / v;
  const pz = vz / v;
  const xb =
    (1 + factor * px * px) * xprime +
    factor * px * py * yprime +
    factor * px * pz * zprime +
    gamma * v * (gamma * tb - ta) * px;
  const yb =
    factor * px * py * xprime +
    (1 + factor * py * py) * yprime +
    factor * py * pz * zprime +
    gamma * v * (gamma * tb - ta) * py;
  const zb =
    factor * px * pz * xprime +
    factor * py * pz * yprime +
    (1 + factor * pz * pz) * zprime +
    gamma * v * (gamma * tb - ta) * pz;
  return [xb, yb, zb, tobj];
}

export default applyRelativity1;
