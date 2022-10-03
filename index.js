const express = require('express');
const { Base } = require('deta');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());

const db = Base('data');

const corsConfig = {
    origin: "https://example.com",
}

app.get('/', cors(corsConfig), async (req, res) => {
    const data = await db.get("stats");
    res.send(data);
});

app.post('/stats', async (req, res) => {
    // Get data
    const { key, guilds, users } = req.body;

    const data = {
        "key": "stats",
        "guilds": guilds,
        "users": users
    }
    // Update database
    const result = await db.put(data);
    // Update Channels
    await updateChannels(data);
    return res.send(result);
});

async function updateChannels(stats) {
    try {
        const url = 'https://discord.com/api/v9/channels/'
        const data = {
            name: `Servers: ${stats.guilds}`,
        }
        let config = {
            headers: { 'Authorization': `Bot ${process.env.BOT_TOKEN}` }
        }
        // guilds channel ID
        await axios.patch(url + 'ID', data, config);
        // members channel ID
        data.name = `Users: ${stats.users}`;
        await axios.patch(url + 'ID', data, config);
    } catch (error) {
        console.log("Update stats error");
        return res.status(error.status).send(error.response.body);
    }
}

// export 'app'
module.exports = app;