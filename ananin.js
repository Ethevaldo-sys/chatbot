const qrcode = require('qrcode-terminal');
const { Client, MessageMedia } = require('whatsapp-web.js');
const client = new Client({
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

const delay = ms => new Promise(res => setTimeout(res, ms));
const userState = {}; // Armazena estado do usuário

client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('✅ Tudo certo! WhatsApp conectado.'));
client.initialize().catch(err => console.error("❌ Erro ao inicializar o cliente:", err));

client.on('message', async msg => {
    try {
        const userId = msg.from;
        if (!userState[userId]) userState[userId] = { etapa: 'inicio' };
        const etapaAtual = userState[userId].etapa;

        if (etapaAtual === 'inicio' && /\b(menu|oi|ol[áa]|Ol|Oi|dia|tarde|noite)\b/i.test(msg.body)) {
            const chat = await msg.getChat();
            await chat.sendStateTyping();
            await delay(2000);
            const name = (await msg.getContact()).pushname.split(" ")[0];
            await client.sendMessage(msg.from, `👋 Olá, ${name}! Qual é sua cidade? 🏙️`);
            userState[userId].etapa = 'aguardando_cidade';
        } else if (etapaAtual === 'aguardando_cidade' && !userState[userId].cidade) {
            userState[userId].cidade = msg.body;
            await client.sendMessage(msg.from, `📍 Certo! E qual o bairro?`);
            userState[userId].etapa = 'aguardando_bairro';
        } else if (etapaAtual === 'aguardando_bairro' && !userState[userId].bairro) {
            userState[userId].bairro = msg.body;
            await client.sendMessage(msg.from, `🔊 Perfeito! Agora enviarei um áudio explicando como você vai lucrar com a Romance.`);
            const chat = await msg.getChat();
            await chat.sendStateRecording();
            await delay(2000);
            try {
                await delay(3000);
                await chat.sendStateRecording();
                await delay(3000);
                await client.sendMessage(msg.from, MessageMedia.fromFilePath('./audio1.mp3'), { sendAudioAsVoice: true });
                await delay(60000);
                const imagem1 = MessageMedia.fromFilePath('./imagem1.png');
                await client.sendMessage(msg.from, imagem1, {caption: ''});
                await delay(10000);
                await chat.sendStateTyping();
                await delay(5000);
                await client.sendMessage(msg.from, `💼 A Romance te dá a oportunidade de conquistar sua independência financeira,  
sem a necessidade de investimentos, mesmo com restrição no nome! 💰  

Então, quer fazer parte do nosso time? 🤝`);
                userState[userId].etapa = 'aguardando_resposta';
            } catch (err) {
                console.error("❌ Erro ao enviar mídia:", err);
            }
        } else if (etapaAtual === 'aguardando_resposta') {
            if (/\b(n[aã]o|nunca|negativo)\b/i.test(msg.body)) {
                await client.sendMessage(msg.from, '🙏 Agradecemos seu contato! Desejamos muito sucesso e felicidades para você! 🎉');
                userState[userId].etapa = 'finalizado';
            } else if (/\b(sim|claro|quero|com certeza)\b/i.test(msg.body)) {
                await client.sendMessage(msg.from, '✨ Ótimo! Para realizar seu pré-cadastro, por favor, informe seu CPF. 🆔');
                userState[userId].etapa = 'aguardando_cpf';
            }
        } else if (etapaAtual === 'aguardando_cpf' && !userState[userId].cpf) {
            userState[userId].cpf = msg.body;
            await client.sendMessage(msg.from, '📆 Agora, por favor, informe sua data de nascimento.');
            userState[userId].etapa = 'aguardando_data_nascimento';
        } else if (etapaAtual === 'aguardando_data_nascimento' && !userState[userId].dataNascimento) {
            userState[userId].dataNascimento = msg.body;
            await client.sendMessage(msg.from, '✅ Recebemos seus dados! Seu pré-cadastro será realizado em alguns momentos. Aguarde nosso retorno. ⏳');
            userState[userId].etapa = 'finalizado';
        } else {
            await client.sendMessage(msg.from, '⚠️ Por favor, responda à pergunta anterior antes de continuar.');
        }
    } catch (err) {
        console.error("❌ Erro no processamento da mensagem:", err);
    }
});
