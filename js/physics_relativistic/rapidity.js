// Fonctions hyperboliques et conversions vitesse/rapidité (TDD, phase 0)

// artanh(x) = 0.5 * ln((1+x)/(1-x)), |x|<1
export function artanh(x) {
    if (x <= -1 || x >= 1) throw new RangeError('artanh: |x| must be < 1');
    return 0.5 * Math.log((1 + x) / (1 - x));
}

// arsinh(x) = ln(x + sqrt(x^2 + 1))
export function arsinh(x) {
    return Math.log(x + Math.sqrt(x * x + 1));
}

// arcosh(x) = ln(x + sqrt(x^2 - 1)), x >= 1
export function arcosh(x) {
    if (x < 1) throw new RangeError('arcosh: x must be >= 1');
    return Math.log(x + Math.sqrt(x * x - 1));
}

// Conversion vitesse (v/c) -> rapidité φ
export function velocityToRapidity(v) {
    if (Math.abs(v) >= 1) throw new RangeError('velocityToRapidity: |v| must be < 1');
    return artanh(v);
}

// Conversion rapidité φ -> vitesse (v/c)
export function rapidityToVelocity(phi) {
    return Math.tanh(phi);
} 