const axios = require('axios');

async function getiplocation(user) {
    try {
        // Fetch the user's public IP address
        const response = await axios.get('https://ipapi.co/json/');
        const ipAddress = response.data.ip;

        // Fetch detailed IP location data using the IP address
        const locationResponse = await axios.get(`https://ipapi.co/${ipAddress}/json/`);
        const {ip,city,region,region_code,country_name,postal} = locationResponse.data;

        // Update user's iplocation field
        user.iplocation = {
            ip,city,region,region_code,country_name,postal
        };

        // Save the user document
        await user.save({ validateBeforeSave: false });

        return;
    } catch (error) {
        console.error('Error getting IP location:', error);
        return {};
    }
}

module.exports = { getiplocation };