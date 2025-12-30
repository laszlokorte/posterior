function gamma(z) {
  return (
    Math.sqrt((2 * Math.PI) / z) *
    Math.pow((1 / Math.E) * (z + 1 / (12 * z - 1 / (10 * z))), z)
  );
}

export const parameters = {
  mean: {
    priors: ["gauss", "laplace", "exponential", "uniform", "chi", "chi2"],
    color: "#ff00aa",
    default: 0,
    renderOffset(all) {
      return 0;
    },
    renderProject(v) {
      return v;
    },
    renderUnProject(v) {
      return v;
    },
    isInRange(v) {
      return true;
    },
    clampProject(all, newVal) {
      return newVal;
    },
    handleProject(all, v) {
      return v;
    },
    handleUnProject(all, v) {
      return v;
    },
    symbol: "μ",
    name: "Mean",
    slider: {
      step: 0.1,
      min: -500,
      max: 500,
      project(all, v) {
        return Math.max(this.min, Math.min(this.max, v));
      },
      unproject(v) {
        return v;
      },
    },
  },
  variance: {
    priors: ["uniform", "exponential", "chi", "chi2"],
    color: "#00aaaa",
    default: 6400,
    renderOffset(all) {
      return all.mean;
    },
    renderProject(v) {
      return Math.sqrt(v);
    },
    renderUnProject(v) {
      return v * v * Math.sign(v);
    },
    isInRange(v) {
      return v >= 0;
    },
    clampProject(all, newVal) {
      return Math.max(0, newVal);
    },
    handleProject(all, v) {
      return Math.sqrt(v);
    },
    handleUnProject(all, v) {
      return v * v * Math.sign(v);
    },
    symbol: "𝜎²",
    name: "Variance",
    slider: {
      step: 0.1,
      min: 1,
      max: 100,
      project(all, v) {
        const m = Math.max(this.min, Math.min(this.max, v));
        return m * m;
      },
      unproject(v) {
        return Math.sqrt(v);
      },
    },
  },
  stdev: {
    priors: ["uniform", "exponential", "chi", "chi2"],
    color: "#00aaaa",
    default: 80,
    renderOffset(all) {
      return all.mean;
    },
    renderProject(v) {
      return v;
    },
    renderUnProject(v) {
      return v;
    },
    isInRange(v) {
      return v >= 0;
    },
    clampProject(all, newVal) {
      return Math.max(0, newVal);
    },
    handleProject(all, v) {
      return v;
    },
    handleUnProject(all, v) {
      return v;
    },
    symbol: "𝜎",
    name: "Standard Deviation",
    slider: {
      step: 0.1,
      min: 1,
      max: 100,
      project(all, v) {
        return Math.max(this.min, Math.min(this.max, v));
      },
      unproject(v) {
        return v;
      },
    },
  },
  scale: {
    priors: ["uniform", "exponential", "chi", "chi2"],
    color: "#ee9900",
    default: 80,
    renderOffset(all) {
      return all.mean;
    },
    renderProject(v) {
      return v;
    },
    renderUnProject(v) {
      return Math.max(0, v);
    },
    isInRange(v) {
      return v > 0;
    },
    clampProject(all, newVal) {
      return Math.max(0, newVal);
    },
    handleProject(all, v) {
      return v;
    },
    handleUnProject(all, v) {
      return v;
    },
    symbol: "s",
    name: "Scale",
    slider: {
      step: 0.1,
      min: 0,
      max: 500,
      project(all, v) {
        return Math.max(this.min, Math.min(this.max, v));
      },
      unproject(v) {
        return v;
      },
    },
  },
  rate: {
    priors: ["uniform", "exponential", "chi", "chi2"],
    color: "#00bbff",
    default: 0.01,
    renderOffset(all) {
      return 0;
    },
    renderProject(v) {
      return v == 0 ? 0 : 1 / v;
    },
    renderUnProject(v) {
      return Math.max(0, v == 0 ? 0 : 1 / v);
    },
    isInRange(v) {
      return v > 0;
    },
    clampProject(all, newVal) {
      return Math.max(0, newVal);
    },
    handleProject(all, v) {
      return v == 0 ? 0 : 1 / v;
    },
    handleUnProject(all, v) {
      return v == 0 ? 0 : 1 / v;
    },
    symbol: "𝜏",
    name: "Mean lifetime",
    slider: {
      step: 0.0001,
      min: 0.0,
      max: 500,
      project(all, v) {
        return v == 0 ? 0 : 1 / v;
      },
      unproject(v) {
        return v == 0 ? 0 : 1 / v;
      },
    },
  },
  min: {
    priors: ["gauss", "laplace", "exponential", "uniform", "chi", "chi2"],
    color: "#cc00cc",
    default: -80,
    renderOffset(all) {
      return 0;
    },
    renderProject(v) {
      return v;
    },
    renderUnProject(v) {
      return v;
    },
    isInRange(v) {
      return true;
    },
    clampProject(all, newVal) {
      return Math.min(all.max, newVal);
    },
    handleProject(all, v) {
      return v;
    },
    handleUnProject(all, v) {
      return v;
    },
    symbol: "a",
    name: "Min",
    slider: {
      step: 0.1,
      min: -500,
      max: 500,
      project(all, v) {
        return Math.max(this.min, Math.min(this.max, Math.min(all.max, v)));
      },
      unproject(v) {
        return v;
      },
    },
  },
  max: {
    priors: ["gauss", "laplace", "exponential", "uniform", "chi", "chi2"],
    color: "#00ddaa",
    default: 80,
    renderOffset(all) {
      return 0;
    },
    renderProject(v) {
      return v;
    },
    renderUnProject(v) {
      return v;
    },
    isInRange(v) {
      return true;
    },
    clampProject(all, newVal) {
      return Math.max(all.min, newVal);
    },
    handleProject(all, v) {
      return v;
    },
    handleUnProject(all, v) {
      return v;
    },
    symbol: "b",
    name: "Max",
    slider: {
      step: 0.1,
      min: -500,
      max: 500,
      project(all, v) {
        return Math.max(this.min, Math.min(this.max, Math.max(all.min, v)));
      },
      unproject(v) {
        return v;
      },
    },
  },
  degree: {
    priors: ["uniform", "exponential", "chi", "chi2"],
    color: "#ff00ee",
    default: 2,
    renderOffset(all) {
      return 0;
    },
    renderProject(v) {
      return v * 25;
    },
    renderUnProject(v) {
      return v / 25;
    },
    isInRange(v) {
      return v > 0;
    },
    clampProject(all, newVal) {
      return Math.max(0.2, newVal);
    },
    handleProject(all, v) {
      return v * 25;
    },
    handleUnProject(all, v) {
      return v / 25;
    },
    symbol: "k",
    name: "Degree of Freedom",
    slider: {
      step: 0.01,
      min: 0.2,
      max: 25,
      project(all, v) {
        return v;
      },
      unproject(v) {
        return v;
      },
    },
  },

  xmin: {
    priors: ["pareto", "exponential", "uniform", "gauss"],
    color: "#4400bb",
    default: 1,
    renderOffset(all) {
      return 0;
    },
    renderProject(v) {
      return v;
    },
    renderUnProject(v) {
      return v;
    },
    isInRange(v) {
      return v > 0;
    },
    clampProject(all, newVal) {
      return Math.max(1e-6, newVal);
    },
    handleProject(all, v) {
      return Math.max(1e-6, v);
    },
    handleUnProject(all, v) {
      return v;
    },
    symbol: "xₘ",
    name: "Minimum",
    slider: {
      step: 0.1,
      min: 0,
      max: 500,
      project(all, v) {
        return Math.max(this.min, Math.min(this.max, v));
      },
      unproject(v) {
        return v;
      },
    },
  },

  alpha: {
    priors: ["pareto", "exponential", "uniform", "gauss"],
    color: "#00dd66",
    default: 2,
    renderOffset(all) {
      return 0;
    },
    renderProject(v) {
      return v;
    },
    renderUnProject(v) {
      return v;
    },
    isInRange(v) {
      return true;
    },
    clampProject(all, newVal) {
      return Math.max(0.2, newVal);
    },
    handleProject(all, v) {
      return 500 - Math.max(1e-6, Math.pow(v, 5));
    },
    handleUnProject(all, v) {
      return Math.pow(Math.max(500 - v, 0), 1 / 5);
    },
    symbol: "α",
    name: "Shape",
    slider: {
      step: 0.01,
      min: 0.15,
      max: 10,
      project(all, v) {
        return Math.max(this.min, Math.min(this.max, v));
      },
      unproject(v) {
        return v;
      },
    },
  },
};

export const distributions = {
  gauss: {
    pdf(x, { mean, stdev }) {
      if (stdev == 0) {
        return 0;
      }
      const d = x - mean;
      return (
        Math.exp((-0.5 * d * d) / (stdev * stdev)) /
        Math.sqrt(2 * Math.PI * (stdev * stdev))
      );
    },
    logPdf(x, { mean, stdev }) {
      const d = x - mean;
      return (
        (-0.5 * d * d) / (stdev * stdev) / 8000 -
        Math.log(Math.sqrt(2 * Math.PI * (stdev * stdev))) / 8000
      );
    },
    get parameters() {
      return ["mean", "stdev"];
    },
    get name() {
      return "Gaußian";
    },
    get color() {
      return "#bb0000";
    },
  },
  laplace: {
    pdf(x, { mean, scale }) {
      if (scale == 0) {
        return 0;
      }
      return Math.exp(-Math.abs((x - mean) / scale)) / scale / 2;
    },
    logPdf(x, { mean, scale }) {
      return -Math.abs((x - mean) / scale) / 8000 - Math.log(scale * 2) / 8000;
    },
    get parameters() {
      return ["mean", "scale"];
    },
    get name() {
      return "Laplacian";
    },
    get color() {
      return "#00bb00";
    },
  },
  exponential: {
    pdf(x, { rate }) {
      if (x < 0) {
        return 0;
      }
      return Math.exp(-Math.abs(x * rate)) * rate;
    },
    logPdf(x, { rate }) {
      if (x < 0) {
        return 0;
      }
      return -Math.abs(x * rate) / 8000 + Math.log(rate) / 8000;
    },
    get parameters() {
      return ["rate"];
    },
    get name() {
      return "Exponential";
    },
    get color() {
      return "#aa00aa";
    },
  },
  uniform: {
    pdf(x, { min, max }) {
      return x >= min && x <= max ? 1 / (max - min) : 0;
    },
    logPdf(x, { min, max }) {
      return x >= min && x <= max ? Math.log(1 / (max - min)) / 8000 : -10000;
    },
    get parameters() {
      return ["min", "max"];
    },
    get name() {
      return "Uniform";
    },
    get color() {
      return "#0000bb";
    },
  },
  chi: {
    pdfScale: 50,
    pdf(x, { degree }) {
      if (x <= 0) return 0;
      x = x / distributions.chi.pdfScale;
      return (
        (((Math.pow(x, degree - 1) /
          Math.pow(2, degree / 2) /
          gamma(degree / 2)) *
          Math.exp((-x * x) / 2)) /
          distributions.chi.pdfScale) *
        2
      );
    },
    logPdf(x, { degree }) {
      if (x <= 0) return 0;
      x = x / distributions.chi.pdfScale;
      return (
        ((degree - 1) * Math.log(x) -
          (degree / 2) * Math.log(2) -
          Math.log(gamma(degree / 2)) +
          (-x * x) / 2 -
          Math.log(distributions.chi.pdfScale)) /
        3600
      );
    },
    get parameters() {
      return ["degree"];
    },
    get name() {
      return "Chi";
    },
    get color() {
      return "#442200";
    },
  },
  chi2: {
    pdfScale: 50,
    pdf(x, { degree }) {
      if (x <= 0) return 0;
      x = x / distributions.chi2.pdfScale;
      return (
        ((Math.pow(x, degree / 2 - 1) /
          Math.pow(2, degree / 2) /
          gamma(degree / 2)) *
          Math.exp(-x / 2)) /
        distributions.chi2.pdfScale
      );
    },
    logPdf(x, { degree }) {
      if (x <= 0) return 0;
      x = x / distributions.chi2.pdfScale;
      return (
        ((degree / 2 - 1) * Math.log(x) -
          (degree / 2) * Math.log(2) -
          Math.log(gamma(degree / 2)) -
          -x / 2 -
          Math.log(distributions.chi2.pdfScale)) /
        3600
      );
    },
    get parameters() {
      return ["degree"];
    },
    get name() {
      return "Chi-Squared";
    },
    get color() {
      return "#bb6600";
    },
  },
  pareto: {
    pdf(x, { xmin: xm, alpha }) {
      if (alpha <= 0 || xm <= 0 || x < xm) {
        return 0;
      }
      return (alpha * Math.pow(xm, alpha)) / Math.pow(x, alpha + 1);
    },
    logPdf(x, { xmin: xm, alpha }) {
      if (alpha <= 0 || xm <= 0 || x < xm) {
        return -Infinity;
      }
      return Math.log(alpha) + alpha * Math.log(xm) - (alpha + 1) * Math.log(x);
    },
    get parameters() {
      return ["xmin", "alpha"]; // scale (minimum), shape
    },
    get name() {
      return "Pareto (Type I)";
    },
    get color() {
      return "#0044bb";
    },
  },
};
