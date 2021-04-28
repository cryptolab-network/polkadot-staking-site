
const constants = {
    KUSAMA_DECIMAL: 1000000000000,
    POLKADOT_DECIMAL: 10000000000,

    isMobile: () => {
        if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            return true
        } else {
            return false
        }
    },

    accountRoles: {
        controller: 'Controller',
        unknown: 'Unknown',
        notNominator: 'Not a Nominator',
        notController: 'Not a Controller',
        validatorController: 'Controller of a Validator'
    }
};

module.exports = constants;