const qrcode = require('qrcode-terminal');
const { Client, MessageMedia } = require('whatsapp-web.js');
const client = new Client({
    puppeteer: {
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    }
});

const delay = ms => new Promise(res => setTimeout(res, ms));
const userState = {}; // Armazena estado do usuário

client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('Tudo certo! WhatsApp conectado.'));
client.initialize();

client.on('message', async msg => {
    const userId = msg.from;
    if (!userState[userId]) userState[userId] = { etapa: 'inicio' };
    const etapaAtual = userState[userId].etapa;

    if (etapaAtual === 'inicio' && /\b(menu|oi|ol[áa]|dia|tarde|noite)\b/i.test(msg.body)) {
        const chat = await msg.getChat();
        await chat.sendStateTyping();
        await delay(2000);
        const name = (await msg.getContact()).pushname.split(" ")[0];
        await client.sendMessage(msg.from, `Olá, ${name}! Qual é sua cidade?`);
        userState[userId].etapa = 'aguardando_cidade';
    } else if (etapaAtual === 'aguardando_cidade') {
        userState[userId].cidade = msg.body;
        await client.sendMessage(msg.from, `Certo! E qual o bairro?`);
        userState[userId].etapa = 'aguardando_bairro';
    } else if (etapaAtual === 'aguardando_bairro') {
        userState[userId].bairro = msg.body;
        await client.sendMessage(msg.from, `Perfeito! Agora enviarei um áudio explicando como você vai lucrar com a Romance.`);
        const chat = await msg.getChat();
        await chat.sendStateRecording();
        await delay(2000);
        try {
        await client.sendMessage(msg.from, MessageMedia.fromFilePath('./audio1.mp3'), { sendAudioAsVoice: true });
        await delay(2000);
        const imagem1 = MessageMedia.fromFilePath('./imagem1.png'); // arquivo em imagem, ´pode ser jpeg também
        await client.sendMessage(msg.from, imagem1, {caption: ''}); //Enviando a imagem



            await client.sendMessage(msg.from, MessageMedia.fromFilePath('./video.mp4'), { caption: 'Confira este vídeo explicativo!' });
        } catch (err) {
            console.log("Erro ao enviar mídia:", err);
        }
        userState[userId].etapa = 'finalizado';
    }

    // Respostas do menu
    const menuOpcoes = {
        '1': 'Nosso serviço oferece consultas médicas 24h.\nLink: https://site.com',
        '2': 'Planos: Individual R$22,50/mês | Família R$39,90/mês.\nLink: https://site.com',
        '3': 'Benefícios: Sorteios anuais, receitas, atendimento 24h.\nLink: https://site.com',
        '4': 'Adesão imediata pelo site ou WhatsApp.\nLink: https://site.com',
        '5': 'Dúvidas? Acesse: https://site.com'
    };

    if (menuOpcoes[msg.body]) {
        const chat = await msg.getChat();
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(msg.from, menuOpcoes[msg.body]);
    }
});
