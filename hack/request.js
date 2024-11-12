import fetch from 'node-fetch';
import inquirer from 'inquirer';
import ora from 'ora';

// Configuration constants
const API_BASE_URL = 'https://cai42.pt';
const CHALLENGES = [
    { id: "cm2ulzhl50000gmgzr58jf2eq", value: "1", description: "Challenge 1" },
    { id: "cm2ulzhq70001gmgzno7mxfm0", value: "1", description: "Challenge 2" },
    { id: "cm2ulzhth0002gmgzgt9m6lep", value: "Delta is our Guide", description: "Motto Challenge" },
    { id: "cm2ulzhws0003gmgzn031oo3y", value: "https://linkedin.com/in/gbasilveira", description: "LinkedIn Challenge" },
    { id: "cm2ulzi050004gmgze3svttn6", value: "1", description: "Challenge 5" },
    { id: "cm2ulzi3f0005gmgzxi7saf8o", value: "1", description: "Challenge 6" },
    { id: "cm2ulzi6n0006gmgz6buis9he", value: "4242.pt", description: "Website Challenge" },
    { id: "cm2ulzi9x0007gmgz52nzp7x0", value: "1", description: "Final Challenge" }
];

class GameSession {
    constructor() {
        this.spinner = ora();
        this.cookies = null;
        this.csrfToken = null;
    }

    // Helper para gerenciar headers comuns
    getCommonHeaders(additionalHeaders = {}) {
        const baseHeaders = {
            'accept': 'text/x-component',
            'content-type': 'text/plain;charset=UTF-8',
            'priority': 'u=1, i',
            'sec-ch-ua': '"Not?A_Brand";v="99", "Chromium";v="130"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Linux"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
        };

        if (this.cookies) {
            baseHeaders['Cookie'] = this.cookies.join('; ');
        }

        return { ...baseHeaders, ...additionalHeaders };
    }

    // Atualiza cookies da sessão
    updateCookies(response) {
        const newCookies = response.headers.raw()['set-cookie'];
        if (newCookies) {
            this.cookies = newCookies;
        }
    }

    // Gera email único com timestamp
    generateUniqueEmail() {
        const timestamp = Date.now();
        return `gbasilveira+cai42+${timestamp}@gmail.com`;
    }

    // Inicializa a sessão obtendo cookies e CSRF token
    async initialize() {
        try {
            this.spinner.start('Inicializando sessão');

            // Get initial cookies
            const providersResponse = await fetch(`${API_BASE_URL}/api/auth/providers`, {
                headers: {
                    'accept': '*/*',
                    'content-type': 'application/json'
                }
            });
            this.updateCookies(providersResponse);

            // Get CSRF token
            const csrfResponse = await fetch(`${API_BASE_URL}/api/auth/csrf`, {
                headers: this.getCommonHeaders({
                    'accept': '*/*',
                    'content-type': 'application/json'
                })
            });
            const csrfData = await csrfResponse.json();
            this.csrfToken = csrfData.csrfToken;

            this.spinner.succeed('Sessão inicializada com sucesso');
            return true;
        } catch (error) {
            this.spinner.fail('Falha ao inicializar sessão');
            console.error('Erro de inicialização:', error);
            return false;
        }
    }

    // Solicita OTP
    async requestOTP(email) {
        try {
            this.spinner.start('Solicitando OTP');
            const response = await fetch(`${API_BASE_URL}/`, {
                method: 'POST',
                headers: this.getCommonHeaders({
                    'next-action': '4464d5e6edbfc2790c122c17c40ad18f02db2bf0',
                    'next-router-state-tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2F%22%2C%22refresh%22%5D%7D%2Cnull%2Cnull%2Ctrue%5D'
                }),
                body: JSON.stringify([email])
            });
            this.updateCookies(response);
            this.spinner.succeed('OTP solicitado com sucesso');
            return true;
        } catch (error) {
            this.spinner.fail('Falha ao solicitar OTP');
            console.error('Erro na solicitação de OTP:', error);
            return false;
        }
    }

    // Autentica com OTP
    async authenticate(email, otp) {
        try {
            this.spinner.start('Autenticando');
            const params = new URLSearchParams({
                redirect: 'false',
                email: email,
                code: otp,
                csrfToken: this.csrfToken,
                callbackUrl: API_BASE_URL
            });

            const response = await fetch(`${API_BASE_URL}/api/auth/callback/credentials?`, {
                method: 'POST',
                headers: this.getCommonHeaders({
                    'accept': '*/*',
                    'content-type': 'application/x-www-form-urlencoded',
                    'x-auth-return-redirect': '1'
                }),
                body: params.toString()
            });
            this.updateCookies(response);

            if (response.ok) {
                this.spinner.succeed('Autenticação bem-sucedida');
                return true;
            } else {
                throw new Error(`Authentication failed with status ${response.status}`);
            }
        } catch (error) {
            this.spinner.fail('Falha na autenticação');
            console.error('Erro de autenticação:', error);
            return false;
        }
    }

    // Submete um desafio
    async submitChallenge(challenge) {
        try {
            this.spinner.start(`Resolvendo: ${challenge.description}`);

            // Refresh request antes do desafio
            await fetch(`${API_BASE_URL}/user/root`, {
                method: 'POST',
                headers: this.getCommonHeaders({
                    'next-action': 'eeb68c8e5c70fa5d3cb8cc46fd0c9bb7c2089d69',
                    'next-router-state-tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22user%22%2C%7B%22children%22%3A%5B%22root%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2F%22%2C%22refresh%22%5D%7D%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D'
                }),
                body: "[]"
            });

            // Empty request antes do desafio
            await fetch(`${API_BASE_URL}/user/root`, {
                method: 'POST',
                headers: this.getCommonHeaders({
                    'next-action': 'd4eab35ad671dfb5f4df649c86319353488a9ce6',
                    'next-router-state-tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22user%22%2C%7B%22children%22%3A%5B%22root%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2F%22%2C%22refresh%22%5D%7D%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D'
                }),
                body: "[]"
            });

            // Submissão do desafio
            const response = await fetch(`${API_BASE_URL}/user/root`, {
                method: 'POST',
                headers: this.getCommonHeaders({
                    'next-action': '99ae8442f6a5ee32f7e7c209083660203694aca8',
                    'next-router-state-tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22user%22%2C%7B%22children%22%3A%5B%22root%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2F%22%2C%22refresh%22%5D%7D%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D'
                }),
                body: JSON.stringify([challenge.id, challenge.value])
            });

            if (response.ok) {
                this.spinner.succeed(`${challenge.description} completado`);
                return true;
            } else {
                throw new Error(`Challenge failed with status ${response.status}`);
            }
        } catch (error) {
            this.spinner.fail(`Falha no desafio: ${challenge.description}`);
            console.error('Erro no desafio:', error);
            return false;
        }
    }
}

async function solveGame() {
    const session = new GameSession();

    try {
        // Inicializa sessão
        if (!await session.initialize()) {
            throw new Error('Falha na inicialização da sessão');
        }

        // Gera e mostra email
        const email = session.generateUniqueEmail();
        console.log(`\nUsando email: ${email}`);

        // Solicita OTP
        if (!await session.requestOTP(email)) {
            throw new Error('Falha na solicitação do OTP');
        }

        // Obtém OTP do usuário
        const { otp } = await inquirer.prompt([{
            type: 'input',
            name: 'otp',
            message: 'Digite o OTP recebido:',
            validate: input => input.length === 6 && !isNaN(input)
        }]);

        // Autentica
        if (!await session.authenticate(email, otp)) {
            throw new Error('Falha na autenticação');
        }

        // Aguarda um pouco para garantir que a autenticação foi processada
        await new Promise(r => setTimeout(r, 1000));

        // Resolve cada desafio em sequência
        for (const challenge of CHALLENGES) {
            if (!await session.submitChallenge(challenge)) {
                throw new Error(`Falha no desafio: ${challenge.description}`);
            }
            // Pequena pausa entre os desafios
            await new Promise(r => setTimeout(r, 500));
        }

        console.log('\n🎉 Todos os desafios foram completados com sucesso! 🎉');

    } catch (error) {
        console.error('\n❌ Erro durante a execução do jogo:', error.message);
        process.exit(1);
    }
}

// Executa o solucionador
solveGame().catch(console.error);
