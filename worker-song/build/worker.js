"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerSong = void 0;
require("dotenv/config");
const aws_sdk_1 = require("aws-sdk");
const axios_1 = __importDefault(require("axios"));
const DYNAMODB_MAX_ITEM_PER_QUERY = 25; // Should be <= 25 because of DynamoDB batch restriction. FYI - Genius API can support up to 50 items/call
const workerSong = async (event) => {
    console.log("Worker Songs");
    const job = JSON.parse(event.Records[0].body);
    if (!job.artistId) {
        console.error("Error artistId undefined");
    }
    try {
        let page = 0;
        let next_page = null;
        do {
            const config = {
                headers: {
                    Authorization: `Bearer ${process.env.GENIUS_API_SECRET_TOKEN}`,
                },
            };
            const url = `https://api.genius.com/artists/${job.artistId}/songs?per_page=${DYNAMODB_MAX_ITEM_PER_QUERY}&page=${++page}`;
            const axiosResponse = await (0, axios_1.default)(url, config);
            const res = axiosResponse.data;
            next_page = res.response.next_page;
            await insertToDdb(res.response.songs, job.artistId);
        } while (next_page && page < next_page);
    }
    catch (error) {
        console.error(error);
        return;
    }
};
exports.workerSong = workerSong;
const insertToDdb = async (songs, artistId) => {
    const options = process.env.IS_OFFLINE
        ? { endpoint: "http://localhost:8000" }
        : {};
    const ddb = new aws_sdk_1.DynamoDB(options);
    const batchParams = createBatchItem(songs, artistId);
    // Call DynamoDB to add the item to the table
    await ddb.batchWriteItem(batchParams).promise();
};
const createBatchItem = (songs, artistId) => {
    const batch = {
        RequestItems: {
            songs: [],
        },
    };
    songs.forEach((song) => {
        batch.RequestItems.songs.push({
            PutRequest: {
                Item: {
                    id: { N: song.id.toString() },
                    title: { S: song.title },
                    full_title: { S: song.full_title },
                    primary_artist_id: { N: song.primary_artist.id.toString() },
                    artist_id: { N: artistId.toString() },
                    artist_names: { S: song.artist_names },
                },
            },
        });
    });
    console.log(JSON.stringify(batch));
    return batch;
};
