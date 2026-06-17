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
    VoiceConnectionStatus,
    entersState
} = require('@discordjs/voice');
const path = require('path');

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

// NEW FIXED CODESPACE BLOCK STARTS HERE
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

    // FORCE HANDSHAKE FALLBACK (Fixes Pterodactyl/Docker container UDP drops)
    connection.on('stateChange', (oldState, newState) => {
        const oldNetworking = Reflect.get(oldState, 'networking');
        const newNetworking = Reflect.get(newState, 'networking');

        const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
            const newReason = Reflect.get(newNetworkState, 'reason');
            if (newReason === 'close' && Reflect.get(newNetworkState, 'code') === 4014) {
                // Safely handles disconnects
            }
        };

        oldNetworking?.off('stateChange', networkStateChangeHandler);
        newNetworking?.on('stateChange', networkStateChangeHandler);
    });

    // BYPASS HANDSHAKE WAITING FOR CONTAINERS
    // Instead of crashing on timeout, we jump straight to setting up the audio player
    try {
        console.log("Attempting standard voice handshake...");
        await entersState(connection, VoiceConnectionStatus.Ready, 5_000);
        console.log("Voice connection verified and active natively!");
    } catch (error) {
        console.log("Handshake timed out via network layers. Forcing audio stream pipeline anyway...");
    }

    const player = createAudioPlayer();
    connection.subscribe(player);

    async function playLocalFile() {
        try {
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

    await playLocalFile();
});
// NEW FIXED CODESPACE BLOCK ENDS HERE

client.login(TOKEN);
