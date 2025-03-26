const qrcode = require('qrcode-terminal'); // Para gerar o QR Code
const { Client, MessageMedia } = require('whatsapp-web.js'); // Biblioteca do WhatsApp
const fs = require('fs'); // Para manipular arquivos
const csv = require('csv-parser'); // Para ler o arquivo .csv
const path = require('path'); // Para trabalhar com caminhos de arquivos

// Cria o cliente do WhatsApp
const client = new Client({
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

// Função para atrasar execuções
const delay = ms => new Promise(res => setTimeout(res, ms));

// Estado do usuário e lista de clientes cadastrados
const userState = {};
let clientesCadastrados = [];

// Caminho para o arquivo .csv (na mesma pasta do bot)
const caminhoCsv = path.join(__dirname, 'contatos.csv');

// Lista de cidades do Pará (exemplos)
const cidadesPara = [
        "Abaetetuba", "Abel Figueiredo", "Acará", "Afuá", "Água Azul do Norte",
        "Alenquer", "Almeirim", "Altamira", "Anajás", "Ananindeua",
        "Anapu", "Augusto Corrêa", "Aurora do Pará", "Aveiro", "Bagre",
        "Baião", "Bannach", "Barcarena", "Belém", "Belterra",
        "Benevides", "Bom Jesus do Tocantins", "Bonito", "Bragança", "Brasil Novo",
        "Brejo Grande do Araguaia", "Breu Branco", "Breves", "Bujaru", "Cachoeira do Arari",
        "Cachoeira do Piriá", "Cametá", "Canaã dos Carajás", "Capanema", "Capitão Poço",
        "Castanhal", "Chaves", "Colares", "Conceição do Araguaia", "Concórdia do Pará",
        "Cumaru do Norte", "Curionópolis", "Curralinho", "Curuá", "Curuçá",
        "Dom Eliseu", "Eldorado dos Carajás", "Faro", "Floresta do Araguaia", "Garrafão do Norte",
        "Goianésia do Pará", "Gurupá", "Igarapé-Açu", "Igarapé-Miri", "Inhangapi",
        "Ipixuna do Pará", "Irituia", "Itaituba", "Itupiranga", "Jacareacanga",
        "Jacundá", "Juruti", "Limoeiro do Ajuru", "Mãe do Rio", "Magalhães Barata",
        "Marabá", "Maracanã", "Marapanim", "Marituba", "Medicilândia",
        "Melgaço", "Mocajuba", "Moju", "Mojuí dos Campos", "Monte Alegre",
        "Muaná", "Nova Esperança do Piriá", "Nova Ipixuna", "Nova Timboteua", "Novo Progresso",
        "Novo Repartimento", "Óbidos", "Oeiras do Pará", "Oriximiná", "Ourém",
        "Ourilândia do Norte", "Pacajá", "Palestina do Pará", "Paragominas", "Parauapebas",
        "Pau D'Arco", "Peixe-Boi", "Piçarra", "Placas", "Ponta de Pedras",
        "Portel", "Porto de Moz", "Prainha", "Primavera", "Quatipuru",
        "Redenção", "Rio Maria", "Rondon do Pará", "Rurópolis", "Salinópolis",
        "Salvaterra", "Santa Bárbara do Pará", "Santa Cruz do Arari", "Santa Isabel do Pará", "Santa Luzia do Pará",
        "Santa Maria das Barreiras", "Santa Maria do Pará", "Santana do Araguaia", "Santarém", "Santarém Novo",
        "Santo Antônio do Tauá", "São Caetano de Odivelas", "São Domingos do Araguaia", "São Domingos do Capim", "São Félix do Xingu",
        "São Francisco do Pará", "São Geraldo do Araguaia", "São João da Ponta", "São João de Pirabas", "São João do Araguaia",
        "São Miguel do Guamá", "São Sebastião da Boa Vista", "Sapucaia", "Senador José Porfírio", "Soure",
        "Tailândia", "Terra Alta", "Terra Santa", "Tomé-Açu", "Tracuateua",
        "Trairão", "Tucumã", "Tucuruí", "Ulianópolis", "Uruará",
        "Vigia", "Viseu", "Vitória do Xingu", "Xinguara"
    
];


// Função para normalizar texto (remover acentos e converter para minúsculas)
const normalizarTexto = (texto) => {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// Função para validar cidade
const validarCidade = (cidade) => {
    return cidadesPara.map(normalizarTexto).includes(normalizarTexto(cidade));
};

// Função para carregar os contatos do arquivo .csv
const carregarContatos = () => {
    return new Promise((resolve, reject) => {
        const contatos = [];
        fs.createReadStream(caminhoCsv)
            .pipe(csv({ separator: ';' })) // Define o delimitador como ponto e vírgula
            .on('data', (row) => {
                // Verifica se a propriedade "numero" existe na linha
                if (row.numero) {
                    // Remove espaços e pontos e vírgulas extras
                    const numeroFormatado = row.numero.replace(/\s+/g, '').replace(/;+/g, ''); // Remove espaços e pontos e vírgulas
                    contatos.push(numeroFormatado); // Adiciona o número formatado à lista
                } else {
                    console.warn('⚠️ A linha do CSV não contém a propriedade "numero":', row);
                }
            })
            .on('end', () => {
                console.log('✅ Contatos carregados com sucesso!');
                console.log('Contatos carregados:', contatos); // Log dos contatos carregados
                resolve(contatos);
            })
            .on('error', (err) => {
                console.error('❌ Erro ao carregar contatos:', err);
                reject(err);
            });
    });
};

// Função para recarregar os contatos periodicamente (a cada X horas)
const recarregarContatos = async () => {
    try {
        clientesCadastrados = await carregarContatos();
        console.log('✅ Contatos recarregados com sucesso!');
    } catch (err) {
        console.error('❌ Erro ao recarregar contatos:', err);
    }
    const horas = 6; // Defina o intervalo de horas aqui
    setTimeout(recarregarContatos, horas * 60 * 60 * 1000); // Recarrega a cada X horas
};

// Inicializa o carregamento dos contatos
recarregarContatos();

// Gera o QR Code para autenticação
client.on('qr', qr => qrcode.generate(qr, { small: true }));

// Confirma que o bot está pronto
client.on('ready', () => console.log('✅ Tudo certo! WhatsApp conectado.'));

// Inicializa o cliente
client.initialize().catch(err => console.error("❌ Erro ao inicializar o cliente:", err));

// Função para verificar se já se passou um dia desde a última mensagem
const jaPassouUmDia = (ultimaMensagem) => {
    if (!ultimaMensagem) return true; // Se não há registro, envia a mensagem
    const umDiaEmMs = 24 * 60 * 60 * 1000; // 1 dia em milissegundos
    return (Date.now() - ultimaMensagem) >= umDiaEmMs; // Verifica se já passou 1 dia
};

// Lógica para receber e responder mensagens
client.on('message', async msg => {
    try {
        // Verifica se a mensagem foi enviada em um grupo
        if (msg.from.endsWith('@g.us')) {
            console.log('🚫 Mensagem recebida em um grupo. Ignorando...');
            return;
        }

        const userId = msg.from;

        // Extrai o número de telefone do userId (remove o @c.us e o código do país se necessário)
        const numeroTelefone = userId.split('@')[0]; // Remove o @c.us
        const numeroComDDD = numeroTelefone.slice(2); // Remove o código do país (55)

        // Verifica se o usuário já está cadastrado
        if (clientesCadastrados.includes(numeroComDDD)) {
            console.log('✅ Número encontrado na lista de contatos cadastrados.');

            // Inicializa o estado do usuário se não existir
            if (!userState[userId]) userState[userId] = {};

            // Verifica se já se passou um dia desde a última mensagem
            if (jaPassouUmDia(userState[userId].ultimaMensagem)) {
                await msg.getChat().then(chat => chat.sendStateTyping()); // Simula digitação
                await delay(2000); // Aguarda 2 segundos
                await client.sendMessage(msg.from, '👋 Olá, Consultora! Deixe sua mensagem que em breve retornaremos. Se precisar de algo, estamos à disposição! 😊');
                userState[userId].ultimaMensagem = Date.now(); // Atualiza o horário da última mensagem
            }
            return; // Encerra a interação se o usuário já estiver cadastrado
        } else {
            // Exibe o log apenas se o número for específico (para depuração)
            if (numeroComDDD === '9191715580') {
                console.log('❌ Número NÃO encontrado na lista de contatos cadastrados:', numeroComDDD);
            }
        }

        // Inicializa o estado do usuário se não existir
        if (!userState[userId]) userState[userId] = { etapa: 'inicio' };
        const etapaAtual = userState[userId].etapa;

        // Lógica do fluxo de conversa
        if (etapaAtual === 'inicio' && /\b(menu|Queria|mais|informações|como|tenho|interesse|de|saber|para|pra|faço|amiga|Dona|dona|Ana|ana|revender|funciona|oi|oie|ol[áa]|Ol|Oi|Oii|oii|iii|dia|tarde|noite)\b/i.test(msg.body)) {
            await msg.getChat().then(chat => chat.sendStateTyping()); // Simula digitação
            await delay(2000); // Aguarda 2 segundos

            // Obtém o contato e verifica se pushname existe
            const contact = await msg.getContact();
            const name = contact.pushname ? contact.pushname.split(" ")[0] : "Usuário";

            await client.sendMessage(msg.from, `👋 Olá, ${name}! Qual é sua cidade? 🏙️`);
            userState[userId].etapa = 'aguardando_cidade';
        } else if (etapaAtual === 'aguardando_cidade' && !userState[userId].cidade) {
            const cidadeInformada = normalizarTexto(msg.body.trim()); // Normaliza a entrada
        if (validarCidade(cidadeInformada)) {
        userState[userId].cidade = cidadeInformada;
        await msg.getChat().then(chat => chat.sendStateTyping()); // Simula digitação
        await delay(2000); // Aguarda 2 segundos
        await client.sendMessage(msg.from, `📍 Certo! E qual o bairro?`);
        userState[userId].etapa = 'aguardando_bairro';
        } else {
        await client.sendMessage(msg.from, `⚠️ Cidade não reconhecida. Por favor, digite o nome de uma cidade válida no Pará.`);
        }
        } else if (etapaAtual === 'aguardando_bairro' && !userState[userId].bairro) {
            userState[userId].bairro = msg.body.trim(); // Aceita qualquer bairro informado
            await msg.getChat().then(chat => chat.sendStateTyping()); // Simula digitação
            await delay(2000); // Aguarda 2 segundos
            await client.sendMessage(msg.from, `🔊 Perfeito! Você prefere receber as explicações de como lucrar com a Romance, por "áudio" ou "texto"?`);
            userState[userId].etapa = 'aguardando_escolha';
        } else if (etapaAtual === 'aguardando_escolha') {
            // Normaliza a mensagem para minúsculas e remove acentos
            const escolha = normalizarTexto(msg.body);

            if (escolha.includes('audio') || escolha.includes('áudio') || escolha.includes('voz')) {
                await client.sendMessage(msg.from, `🔊 Ótimo! Vou enviar um áudio explicando como você vai lucrar com a Romance.`);
                userState[userId].etapa = 'aguardando_audio';
                await msg.getChat().then(chat => chat.sendStateRecording()); // Simula gravação de áudio
                await delay(3000); // Aguarda 3 segundos
                try {
                    await delay(3000); // Aguarda 3 segundos
                    await msg.getChat().then(chat => chat.sendStateRecording()); // Simula gravação de áudio
                    await delay(3000); // Aguarda 3 segundos
                    await client.sendMessage(msg.from, MessageMedia.fromFilePath('./audio1.mp3'), { sendAudioAsVoice: true });
                    await delay(60000); // Aguarda 60 segundos
                    const imagem1 = MessageMedia.fromFilePath('./imagem1.png');
                    await client.sendMessage(msg.from, imagem1, { caption: '' });
                    await delay(5000); // Aguarda 5 segundos
                    await msg.getChat().then(chat => chat.sendStateTyping()); // Simula digitação
                    await delay(5000); // Aguarda 5 segundos
                    await client.sendMessage(msg.from, `💼 A Romance te dá a oportunidade de conquistar sua independência financeira,  
sem a necessidade de investimentos, mesmo com restrição no nome! 💰  

Então, quer fazer parte do nosso time? 🤝`);
                    userState[userId].etapa = 'aguardando_resposta';
                } catch (err) {
                    console.error("❌ Erro ao enviar mídia:", err);
                }
            } else if (escolha.includes('texto') || escolha.includes('escrito')) {
                await msg.getChat().then(chat => chat.sendStateTyping()); // Simula digitação
                await delay(10000); // Aguarda 10 segundos
                await client.sendMessage(msg.from, `📝 Vou te explicar como funciona os seus lucros com a venda dos produtos da Romance. 💰

✨ Como funciona?

1. 🛍️ Após a aprovação do seu cadastro, você receberá uma sacola recheada de produtos (calcinhas, sutiãs, conjuntos, leggings, vestidos, calças, tops, etc).

2. ⏳ Com os produtos em mãos, você terá *40 dias* para fazer as vendas.

3. 💵 Após esse período, faremos o acerto com você. Nesse dia:
    →  Todas as peças que não tiver vendido e ainda estiverem com a etiqueta e sem uso, você pode trocar por outras.
    →  Você pagará apenas pelas peças que vendeu!

4. 💸 A melhor parte é que você terá de *30 a 40% de lucro* sobre suas vendas. (Em alguns produtos, você define sua própria comissão!)

✅ Benefícios:

- 🤑 Ganhe comissões atraentes.
- 💵 Não precisa fazer nenhum investimento.
- 🏠 Tenha liberdade para trabalhar de onde estiver.
- 📈 Cresça junto com a nossa equipe.

🛍️ Confira alguns dos nossos produtos incríveis!`);

                // Envia a imagem após o texto
                try {
                    const imagem1 = MessageMedia.fromFilePath('./imagem1.png');
                    await client.sendMessage(msg.from, imagem1, { caption: '' });
                    await delay(10000); // Aguarda 10 segundos
                    await msg.getChat().then(chat => chat.sendStateTyping()); // Simula digitação
                    await delay(5000); // Aguarda 5 segundos
                    await client.sendMessage(msg.from, `💼 A Romance te dá a oportunidade de conquistar sua independência financeira,  
sem a necessidade de investimentos, mesmo com restrição no nome! 💰  

Então, quer fazer parte do nosso time? 🤝`);
                    userState[userId].etapa = 'aguardando_resposta';
                } catch (err) {
                    console.error("❌ Erro ao enviar imagem:", err);
                }
            } else {
                await client.sendMessage(msg.from, `❌ Opção inválida. Por favor, digite "áudio" ou "texto".`);
            }
        } else if (etapaAtual === 'aguardando_resposta') {
            if (/\b(n[aã]o|nunca|negativo)\b/i.test(msg.body)) {
                await msg.getChat().then(chat => chat.sendStateTyping()); // Simula digitação
                await delay(2000); // Aguarda 2 segundos
                await client.sendMessage(msg.from, '😢 Ah, que pena! 🙏 Agradecemos seu contato! Desejamos muito sucesso e felicidades para você! 🎉. Mas se mudar de ideia, estaremos aqui!😊');
                delete userState[userId]; // Finaliza a conversa
                return; // Garante que não haverá mais respostas
            } else if (/\b(sim|claro|quero|com certeza)\b/i.test(msg.body)) {
                await msg.getChat().then(chat => chat.sendStateTyping()); // Simula digitação
                await delay(2000); // Aguarda 2 segundos
                await client.sendMessage(msg.from, '✨ Ótimo! Para realizar seu pré-cadastro, por favor, informe seu CPF (somente números). 🆔');
                userState[userId].etapa = 'aguardando_cpf';
            }
        } else if (etapaAtual === 'aguardando_cpf' && !userState[userId].cpf) {
            // Remove pontos e traços do CPF
            const cpf = msg.body.replace(/\D/g, ''); // Remove tudo que não for número
            if (/^\d{11}$/.test(cpf)) {
                userState[userId].cpf = cpf;
                await msg.getChat().then(chat => chat.sendStateTyping()); // Simula digitação
                await delay(2000); // Aguarda 2 segundos
                await client.sendMessage(msg.from, '📆 Agora, por favor, informe sua data de nascimento (dia/mês/ano).');
                userState[userId].etapa = 'aguardando_data_nascimento';
            } else {
                await client.sendMessage(msg.from, '⚠️ CPF inválido! Por favor, informe um CPF válido.');
            }
        } else if (etapaAtual === 'aguardando_data_nascimento' && !userState[userId].dataNascimento) {
            // Remove caracteres não numéricos da data de nascimento
            const dataNascimento = msg.body.replace(/\D/g, ''); // Remove tudo que não for número
            if (/^\d{8}$/.test(dataNascimento)) {
                userState[userId].dataNascimento = dataNascimento.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3'); // Formata a data
                await msg.getChat().then(chat => chat.sendStateTyping()); // Simula digitação
                await delay(2000); // Aguarda 2 segundos
                await client.sendMessage(msg.from, '✅ Recebemos seus dados! Seu pré-cadastro será realizado em alguns momentos. Aguarde nosso retorno. ⏳');
                userState[userId].etapa = 'finalizado';
            } else {
                await client.sendMessage(msg.from, '⚠️ Data de nascimento inválida! Por favor, use o formato DD/MM/AAAA ou DDMMAAAA.');
            }
        } else if (userState[userId]?.etapa !== 'finalizado' && etapaAtual !== 'inicio') {
            await client.sendMessage(msg.from, '⚠️ Por favor, aguarde finalizar as explicações antes de continuar.');
        }
    } catch (err) {
        console.error("❌ Erro no processamento da mensagem:", err);
    }
});