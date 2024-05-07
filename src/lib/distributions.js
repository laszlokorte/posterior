function gamma(z) {
    return Math.sqrt(2 * Math.PI / z) * Math.pow((1 / Math.E) * (z + 1 / (12 * z - 1 / (10 * z))), z);
}

export const parameters = {
    mean: {
        priors: ['gauss', 'laplace', 'exponential', 'uniform', 'chi', 'chi2'],
        color: 'MediumVioletRed',
        default: 0,
        renderOffset(all) {
            return 0
        },
        renderProject(v) {
            return v
        },
        clampProject(all, newVal) {
            return newVal
        },
        handleProject(all, v) {
            return v
        },
        handleUnProject(all, v) {
            return v
        },
        symbol: 'μ',
        name: 'Mean',
        slider: {
            step: .1,
            min: -500,
            max: 500,
            project(all, v) {
                return Math.max(this.min, Math.min(this.max, v))
            },
            unproject(v) {
                return v
            }
        }
    },
    variance: {
        priors: ['uniform','exponential', 'chi', 'chi2'],
        color: 'darkcyan',
        default: 6400,
        renderOffset(all) {
            return all.mean
        },
        renderProject(v) {
            return Math.sqrt(v)
        },
        clampProject(all, newVal) {
            return Math.max(0, newVal)
        },
        handleProject(all, v) {
            return Math.sqrt(v)
        },
        handleUnProject(all, v) {
            return v*v*Math.sign(v)
        },
        symbol: '𝜎²',
        name: 'Variance',
        slider: {
            step: .1,
            min: 1,
            max: 100,
            project(all, v) {
                return Math.pow(Math.max(this.min, Math.min(this.max, v)), 2)
            },
            unproject(v) {
                return Math.sqrt(v)
            }
        }
    },
    scale: {
        priors: ['uniform','exponential', 'chi', 'chi2'],
        color: 'orange',
        default: 80,
        renderOffset(all) {
            return all.mean
        },
        renderProject(v) {
            return v
        },
        clampProject(all, newVal) {
            return Math.max(0, newVal)
        },
        handleProject(all, v) {
            return v
        },
        handleUnProject(all, v) {
            return v
        },
        symbol: 's',
        name: 'Scale',
        slider: {
            step: .1,
            min: 0,
            max: 500,
            project(all, v) {
                return Math.max(this.min, Math.min(this.max, v))
            },
            unproject(v) {
                return v
            }
        }
    },
    rate: {
        priors: ['uniform','exponential', 'chi', 'chi2'],
        color: 'aquamarine',
        default: 0.01,
        renderOffset(all) {
            return 0
        },
        renderProject(v) {
            return 1/v
        },
        clampProject(all, newVal) {
            return Math.max(0, newVal)
        },
        handleProject(all, v) {
            return 1/v
        },
        handleUnProject(all, v) {
            return 1/v
        },
        symbol: '1/λ',
        name: '1/Rate',
        slider: {
            step: .01,
            min: 0.1,
            max: 3,
            project(all, v) {
                return Math.max(this.min*this.min*this.min*this.min, Math.min(this.max*this.max*this.max*this.max, (v*v*v*v)))
            },
            unproject(v) {
                return Math.sqrt(Math.sqrt(v))
            }
        }
    },
    min: {
        priors: ['gauss', 'laplace', 'exponential', 'uniform', 'chi', 'chi2'],
        color: 'purple',
        default: -80,
        renderOffset(all) {
            return 0
        },
        renderProject(v) {
            return v
        },
        clampProject(all, newVal) {
            return Math.min(all.max, newVal)
        },
        handleProject(all, v) {
            return v
        },
        handleUnProject(all, v) {
            return v
        },
        symbol: 'a',
        name: 'Min',
        slider: {
            step: .1,
            min: -500,
            max: 500,
            project(all, v) {
                return Math.max(this.min, Math.min(this.max, Math.min(all.max, v)))
            },
            unproject(v) {
                return v
            }
        },
    },
    max: {
        priors: ['gauss', 'laplace', 'exponential', 'uniform', 'chi', 'chi2'],
        color: 'teal',
        default: 80,
        renderOffset(all) {
            return 0
        },
        renderProject(v) {
            return v
        },
        clampProject(all, newVal) {
            return Math.max(all.min, newVal)
        },
        handleProject(all, v) {
            return v
        },
        handleUnProject(all, v) {
            return v
        },
        symbol: 'b',
        name: 'Max',
        slider: {
            step: .1,
            min: -500,
            max: 500,
            project(all, v) {
                return Math.max(this.min, Math.min(this.max, Math.max(all.min, v)))
            },
            unproject(v) {
                return v
            }
        },
    },
    degree: {
        priors: ['uniform','exponential', 'chi', 'chi2'],
        color: 'hotpink',
        default: 2,
        renderOffset(all) {
            return 0
        },
        renderProject(v) {
            return v*25
        },
        clampProject(all, newVal) {
            return Math.max(0.25, newVal)
        },
        handleProject(all, v) {
            return v*25
        },
        handleUnProject(all, v) {
            return v/25
        },
        symbol: 'k',
        name: 'Degree of Freedom',
        slider: {
            step: .1,
            min: 1,
            max: 25,
            project(all, v) {
                return v
            },
            unproject(v) {
                return v
            }
        },
    },
}

export const distributions = {
    gauss: {
        pdf(x, {mean,variance}) {
            return Math.exp(-0.5*Math.pow(x-mean,2)/variance)/Math.sqrt(2*Math.PI*variance)
        },
        logPdf(x, {mean,variance}) {
            return -0.5*Math.pow(x-mean,2)/variance/8000 - Math.log(Math.sqrt(2*Math.PI*variance))/8000
        },
        get parameters () {
            return ['mean','variance']
        },
        get name () {
            return "Gaußian"
        },
        get color() {
            return 'darkred'
        }
    },
    laplace: {
        pdf(x, {mean,scale}) {
            return Math.exp(-Math.abs((x-mean)/scale))/scale/2
        },
            logPdf(x, {mean,scale}) {
            return -Math.abs((x-mean)/scale)/8000 - Math.log(scale*2)/8000
        },
        get parameters () {
            return ['mean','scale']
        },
        get name () {
            return "Laplacian"
        },
        get color() {
            return 'darkgreen'
        }
    },
    exponential: {
        pdf(x, {rate}) {
            if (x<0) {
                return 0
            }
            return Math.exp(-Math.abs(x*rate))*rate
        },
        logPdf(x, {rate}) {
            if (x<0) {
                return 0
            }
            return -Math.abs(x*rate)/8000 + Math.log(rate)/8000
        },
        get parameters () {
            return ['rate']
        },
        get name () {
            return "Exponential"
        },
        get color() {
            return 'rebeccapurple'
        }
    },
    uniform: {
        pdf(x, {min,max}) {
            return x>=min && x<=max ? 1/(max-min) : 0
        },
        logPdf(x, {min,max}) {
            return x>=min && x<=max ? Math.log(1/(max-min))/8000 : -10000
        },
        get parameters () {
            return ['min','max']
        },
        get name () {
            return "Uniform"
        },
        get color() {
            return 'darkblue'
        }
    },
    chi: {
        pdfScale: 50,
        pdf(x, {degree}) {
            if(x<=0) return 0
            x = x / distributions.chi.pdfScale
            return Math.pow(x,degree-1)/Math.pow(2,degree/2)/gamma(degree/2) * Math.exp(-x*x/2) / distributions.chi.pdfScale * 2
        },
        logPdf(x, {degree}) {   
            if(x<=0) return 0
            x = x / distributions.chi.pdfScale        
            return (((degree-1)*Math.log(x)-(degree/2)*Math.log(2)-Math.log(gamma(degree/2)) + (-x*x/2)) - Math.log(distributions.chi.pdfScale))/3600
        },
        get parameters () {
            return ['degree']
        },
        get name () {
            return "Chi"
        },
        get color() {
            return 'brown'
        }
    },
    chi2: {
        pdfScale: 50,
        pdf(x, {degree}) {
            if(x<=0) return 0
            x = x / distributions.chi2.pdfScale
            return Math.pow(x,degree/2-1)/Math.pow(2,degree/2)/gamma(degree/2) * Math.exp(-x/2) / distributions.chi2.pdfScale
        },
        logPdf(x, {degree}) {
            if(x<=0) return 0
            x = x / distributions.chi2.pdfScale
            return ((degree/2-1)*Math.log(x)-(degree/2)*Math.log(2)-Math.log(gamma(degree/2)) - (-x/2) - Math.log(distributions.chi2.pdfScale))/3600
        },
        get parameters () {
            return ['degree']
        },
        get name () {
            return "Chi-Squared"
        },
        get color() {
            return 'brown'
        }
    },
}