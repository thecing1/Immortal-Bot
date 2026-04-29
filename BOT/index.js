const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, REST } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// 1. Define the Slash Command
const commands = [
    new SlashCommandBuilder()
    .setName('join')
    .setDescription('Makes the bot join your current voice channel and stay forever.')
].map(command => command.toJSON());

// 2. Register Slash Commands with Discord
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Successfully registered /join command.');
    } catch (error) {
        console.error(error);
    }
});

// 3. Handle the /join Interaction
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'join') {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: 'You must be in a voice channel for me to join!', ephemeral: true });
        }

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
            selfDeaf: false // Set to true if you want the bot to be deafened
        });

        // Anti-Leave Logic: If the bot gets kicked or disconnected, it tries to rejoin
        connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log('Disconnected! Attempting to rejoin...');
            joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
        });

        await interaction.reply(`Joined and staying in **${voiceChannel.name}**!`);
    }
});

client.login(process.env.TOKEN);
