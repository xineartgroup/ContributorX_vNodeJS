const express = require("express");
const http = require('http');

const makeApiRequest = (method, path, sessionCookie, data = null) => {
    return new Promise((resolve, reject) => {
        const postData = data ? JSON.stringify(data) : null;

        const options = {
            hostname: 'localhost',
            port: 3000,
            path,
            method,
            headers: sessionCookie ? ( postData ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Cookie': sessionCookie
            } : {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            } ) : ( postData ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            } : {
                'Content-Type': 'application/json'
            } )
        };

        const req = http.request(options, (response) => {
            let responseData = '';

            response.on('data', (chunk) => {
                responseData += chunk;
            });

            response.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    resolve(result);
                } catch (error) {
                    reject("Invalid JSON response");
                }
            });
        });

        req.on('error', (error) => reject("Request error: " + error));

        if (postData) {
            req.write(postData);
        }

        req.end();
    });
};

module.exports = { makeApiRequest };
