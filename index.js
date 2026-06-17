const ffmpeg = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpeg;

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');

const TOKEN = process.env.DISCORD_TOKEN;
const SERVER_ID = "1365789773666582589";
const VC_ID = "1365963499213160518";
const LOCAL_FILE_PATH = path.join(__dirname, 'Elevator Music - aeiouFU (128k).mp3'); 

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}! Audio system initializing...`);
    
    const guild = client.guilds.cache.get(SERVER_ID);
    if (!guild) return console.error("Server not found!");

    const connection = joinVoiceChannel({
        channelId: VC_ID,
        guildId: SERVER_ID,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true
    });

    const player = createAudioPlayer();
    connection.subscribe(player);

    async function playLocalFile() {
        try {
            let resource = createAudioResource(LOCAL_FILE_PATH, { inlineVolume: true });
            resource.volume.setVolume(1.0);
            player.play(resource);
            console.log("Audio pipeline broadcasting successfully!");
        } catch (error) {
            console.error("Playback engine failure:", error);
        }
    }

    player.on(AudioPlayerStatus.Idle, () => playLocalFile());
    await playLocalFile();
});

client.login(TOKEN);
