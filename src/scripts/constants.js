
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
        controller: 'OK',
        unknown: 'Unknown',
        notNominator: 'The address is not a nominator stash',
        validator: 'The account is a validator',
        validatorController: "The stash is already a validator's controller"
    }
};

module.exports = constants;