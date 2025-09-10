define([], function() {
    const password1Input = document.getElementById('password1');
    const password2Input = document.getElementById('password2');

    const passwordRules = {
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        special: false,
        match: false,
    };

    function validatePassword() {
        const password = password1Input.value;

        passwordRules.uppercase = /[A-Z]/.test(password);
        passwordRules.lowercase = /[a-z]/.test(password);
        passwordRules.number = /[0-9]/.test(password);
        passwordRules.special = /[^A-Za-z0-9]/.test(password);
        passwordRules.length = password.length >= 9;

        // Update DOM classes
        document.getElementById('rule-0').classList.toggle('valid', passwordRules.lowercase || passwordRules.uppercase);
        document.getElementById('rule-1').classList.toggle('valid', passwordRules.special);
        document.getElementById('rule-2').classList.toggle('valid', passwordRules.number);
        document.getElementById('rule-3').classList.toggle('valid', passwordRules.uppercase && passwordRules.lowercase);
        document.getElementById('rule-4').classList.toggle('valid', passwordRules.length);

        validatePasswordMatch();
    }

    function validatePasswordMatch() {
        const password = password1Input.value;
        const confirmPassword = password2Input.value;
        const confirmMessage = document.getElementById('rule-confirm');

        passwordRules.match = password === confirmPassword && password.length > 0;

        if (passwordRules.match) {
            confirmMessage.querySelector('span').textContent = 'Your passwords match';
            document.getElementById('rule-confirm').classList.toggle('valid', true);
            password2Input.classList.toggle('invalid', false);
            password2Input.classList.toggle('valid', true);
        } else {
            confirmMessage.querySelector('span').textContent = 'Passwords do not match';
            document.getElementById('rule-confirm').classList.toggle('valid', false);
            password2Input.classList.toggle('invalid', confirmPassword.length > 0);
            password2Input.classList.toggle('valid', false);
        }

        const signupBtn = document.getElementById('signup-btn');
        const allRulesValid = passwordRules.length && passwordRules.lowercase && passwordRules.uppercase && passwordRules.number && passwordRules.special && passwordRules.match;
        signupBtn.disabled = !allRulesValid;
    }

    password1Input.addEventListener('input', validatePassword);
    password2Input.addEventListener('input', validatePasswordMatch);
});