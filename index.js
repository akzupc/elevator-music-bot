const http = require('http');
const https = require('https');

http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);
setInterval(() => http.get(`https://${process.env.RENDER_EXTERNAL_URL?.replace('https://', '')}`), 600000);

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

const TOKEN = process.env.DISCORD_TOKEN;
const SERVER_ID = "1365789773666582589";
const VC_ID = "1365963499213160518";
const YOUTUBE_URL = "https://jazz.fm";

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages],
    rest: { timeout: 60000 }
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

    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: 'pause'
        }
    });
    connection.subscribe(player);

    async function playStream() {
        https.get(YOUTUBE_URL, (res) => {
            const resource = createAudioResource(res, { inputType: StreamType.Arbitrary });
            player.play(resource);
        }).on('error', (error) => {
            console.error("Stream network error, retrying...", error);
            setTimeout(playStream, 5000);
        });
    }

    // Fix: Force the connection network pipe open the millisecond it links
    connection.on(VoiceConnectionStatus.Ready, () => {
        console.log("Voice pipe connection securely opened. Activating stream...");
        playStream();
    });

    // Auto-reconnect if cloud hosting drops packages
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5000),
            ]);
        } catch (error) {
            console.log("Network change detected. Forcing reconnection...");
            connection.destroy();
            // Re-join cleanly
            const newConn = joinVoiceChannel({ channelId: VC_ID, guildId: SERVER_ID, adapterCreator: guild.voiceAdapterCreator, selfDeaf: true });
            newConn.subscribe(player);
        }
    });

    player.on(AudioPlayerStatus.Idle, () => {
        console.log("Track disconnected. Restarting stream...");
        playStream();
    });

    player.on('error', error => console.error(`Player error: ${error.message}`));
});

client.login(TOKEN);
