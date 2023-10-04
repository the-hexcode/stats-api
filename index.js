const express = require('express');
const { Base } = require('deta');
const Joi = require('joi');
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

app.get('/discord', async (req, res) => {
    const data = await db.get("stats");
    return res.redirect(`https://img.shields.io/badge/servers-${data.guilds}-FF355E?style=social&logo=discord`);
});

app.post('/stats', async (req, res) => {
    // Auth
    const { api_key } = req.query;
    if (api_key !== process.env.API_KEY) return res.status(403).send("Unauthorized! Invalid api_key");
    // Get data
    const { key, guilds, users } = req.body;
    // Validate
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    else {
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
    }
});

async function updateChannels(stats) {
    try {
        const url = 'https://discord.com/api/v10/channels/'
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

function validate(data) {
    const schema = {
        guilds: Joi.number().required(),
        users: Joi.number().required()
    }
    return Joi.object(schema).validate(data);
}


// export 'app'
module.exports = app;