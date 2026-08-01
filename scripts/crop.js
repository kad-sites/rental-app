const sharp = require('sharp');
const fs = require('fs');

async function main() {
    try {
        const imgPath = 'C:\\Users\\ZOHEB\\.gemini\\antigravity\\brain\\6b589f75-43bc-4a9e-a862-e712c362280d\\.user_uploaded\\media__1785546062076.jpg';
        const meta = await sharp(imgPath).metadata();
        console.log(meta);
        
        // Define bounding box to extract only the blue house.
        // Assuming the image is a standard square (e.g. 1000x1000).
        // The house is in the upper half.
        // Let's extract something like width * 0.5, height * 0.45.
        
        const width = Math.floor(meta.width * 0.5);
        const height = Math.floor(meta.height * 0.45);
        const left = Math.floor(meta.width * 0.25);
        const top = Math.floor(meta.height * 0.20);
        
        await sharp(imgPath)
            .extract({ left, top, width, height })
            .toFile('C:\\Users\\ZOHEB\\.gemini\\antigravity\\scratch\\kirayapay-android\\app\\src\\main\\res\\drawable\\logo_house.jpg');
        
        console.log("Cropped successfully to logo_house.jpg");
    } catch (e) {
        console.error(e);
    }
}
main();
