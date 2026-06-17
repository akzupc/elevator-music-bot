// 1. Force the environment to locate the static FFmpeg binary immediately
const ffmpeg = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpeg;

const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const path = require('path');

// 2. Setup the required Render web-server endpoint
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is alive!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Web server tracking live on port ${PORT}`);
});

// 3. Keep-alive engine: self-pings every 2 minutes so Render doesn't throttle the audio stream
setInterval(() => {
    const url = process.env.RENDER_EXTERNAL_URL;
    if (url) {
        http.get(url, (res) => {
            res.resume(); // Frees up memory allocation
        }).on('error', (err) => console.error('Self-ping skipped:', err.message));
    }
}, 120000);

const TOKEN = process.env.DISCORD_TOKEN;
const SERVER_ID = "1365789773666582589";
const VC_ID = "1365963499213160518";

const LOCAL_FILE_PATH = path.join(__dirname, 'Elevator Music - aeiouFU (128k).mp3'); 

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}! Initializing offline local stream...`);
    
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
            // 4. Read the file with inline volume processing forced 
            // This processes audio chunks in Node before passing it to Render's strict network layer
            let resource = createAudioResource(LOCAL_FILE_PATH, {
                inputType: StreamType.Arbitrary,
                inlineVolume: true
            });
            
            // Explicitly unlock and set the volume to 100%
            resource.volume.setVolume(1.0);
            
            player.play(resource);
            console.log("Local music track successfully activated!");
        } catch (error) {
            console.error("Local playback engine error:", error);
        }
    }

    player.on(AudioPlayerStatus.Idle, () => {
        console.log("Track finished. Restarting local loop...");
        playLocalFile();
    });

    player.on('error', error => console.error(`Player error: ${error.message}`));

    await playLocalFile();
});

client.login(TOKEN);
