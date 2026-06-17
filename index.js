// 1. Force the environment to locate the static FFmpeg binary immediately
const ffmpeg = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpeg;

const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    StreamType,
    VoiceConnectionStatus,
    entersState
} = require('@discordjs/voice');
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
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildVoiceStates
    ]
});

// FIX: Swapped out deprecated 'ready' event for stable v14+ 'clientReady' name
client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}! Initializing voice pipeline...`);
    
    const guild = client.guilds.cache.get(SERVER_ID);
    if (!guild) return console.error("Server not found!");

    const connection = joinVoiceChannel({
        channelId: VC_ID,
        guildId: SERVER_ID,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true
    });

    // FIX: Rebuilds UDP socket network configurations if container drops packets on startup
    connection.on('stateChange', (oldState, newState) => {
        const oldNetworking = Reflect.get(oldState, 'networking');
        const newNetworking = Reflect.get(newState, 'networking');

        const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
            const newReason = Reflect.get(newNetworkState, 'reason');
            if (newReason === 'close' && Reflect.get(newNetworkState, 'code') === 4014) {
                // Safely intercepts disconnect commands without crashing runtime
            }
        };

        oldNetworking?.off('stateChange', networkStateChangeHandler);
        newNetworking?.on('stateChange', networkStateChangeHandler);
    });

    // FIX: Wait for connection to transition to Ready state before building resources
    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
        console.log("Voice connection verified and active!");
    } catch (error) {
        console.error("Voice handshake failed to establish:", error);
        return;
    }

    const player = createAudioPlayer();
    connection.subscribe(player);

    async function playLocalFile() {
        try {
            // FIX: Removed StreamType.Arbitrary to prevent codec detection dropouts
            let resource = createAudioResource(LOCAL_FILE_PATH, {
                inlineVolume: true
            });
            
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

    // Kick off audio playback loops
    await playLocalFile();
});

client.login(TOKEN);
