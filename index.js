const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

// Paste your exact credentials inside the quotes below:
const TOKEN = "MTUxNjg2NDkxMzc5NTE5MDk1NQ.GTEfB8.YUMNgRGvQFuOL9nJUlPp36jKCPzd6iioUyNlmc"; 
const SERVER_ID = "1365789773666582589";
const VC_ID = "1365963499213160518";
const YOUTUBE_URL = "https://www.youtube.com/watch?v=DiaLMuUQYaw"; // Your 1 hour elevator music video

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}! Initializing loop...`);
    
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

    async function playStream() {
        try {
            // Fetch stream directly from YouTube
            let stream = await play.stream(YOUTUBE_URL, { quality: 0 });
            let resource = createAudioResource(stream.stream, { inputType: stream.type });
            player.play(resource);
        } catch (error) {
            console.error("Stream error, retrying...", error);
            setTimeout(playStream, 5000);
        }
    }

    // Auto-loop when the video finishes
    player.on(AudioPlayerStatus.Idle, () => {
        console.log("Track finished. Restarting loop...");
        playStream();
    });

    player.on('error', error => console.error(`Player error: ${error.message}`));

    // Start playing immediately on startup
    await playStream();
});

client.login(TOKEN);
