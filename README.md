# Flappy Future

A futuristic take on the classic Flappy Bird game with beautiful neon visuals, particle effects, and smooth gameplay.

![Flappy Future Game](https://retroflappyfuture.netlify.app/)


https://github.com/user-attachments/assets/09a3927b-8940-4649-8c22-f4431dc71d5e


## 🎮 Play Online


https://github.com/user-attachments/assets/e1b6410a-b04a-42eb-ad3c-2ae1617adc67


Play the game online at:  (https://retroflappyfuture.netlify.app/) [ */make sure to play in normal mode/* ]

## ✨ Features

- Beautiful futuristic neon design with glowing effects
- Smooth gameplay with balanced difficulty
- Particle effects and visual feedback
- Mobile and desktop compatible
- Progressive difficulty that increases gradually
- High score tracking with local storage
- Background music and sound effects

## 🚀 Deployment

### AWS S3 Hosting

This game is hosted on AWS S3 as a static website. Here's how it was deployed:

1. **Create an S3 bucket**
   - Create a bucket with a unique name
   - Enable "Static website hosting" in bucket properties
   - Set index.html as the index document

2. **Configure bucket permissions**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::flappyfuture/*"
       }
     ]
   }
   ```

3. **Upload game files**
   ```bash
   aws s3 sync ./www/ s3://your-bucket-name/ --acl public-read
   ```

4. **Access the game**
   - The game is available at the S3 website endpoint:
   - `http://flappyfuture.s3-website.ap-south-1.amazonaws.com`

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/flappyfuture-aws.git
   cd flappy-future
   ```

2. Open the game in a browser:
   ```bash
   # Using Python's built-in server
   python -m http.server 8000
   # Then open http://localhost:8000/www/ in your browser
   ```

## 🛠️ Project Structure

```
flappy-bird/
├── www/                  # Web assets (HTML, CSS, JS)
│   ├── index.html        # Main HTML file
│   ├── style.css         # Styles
│   ├── game.js           # Game logic
│   ├── images/           # Game images
│   └── sounds/           # Sound effects
├── README.md             # This file
└── LICENSE               # MIT License
```

## 📱 Controls

- **Desktop**: Click or press SPACE to make the bird flap
- **Mobile**: Tap anywhere on the screen to flap

## 🔧 Game Mechanics

The game features carefully tuned mechanics for an enjoyable experience:

- Balanced gravity and lift forces
- Smooth bird movement with proper momentum
- Consistent pipe spacing and positioning
- Gradual difficulty progression
- Particle effects for visual feedback

## 🎮 Game Customization

You can customize the game by modifying these parameters in `game.js`:

- `gravity`: Controls how quickly the bird falls (default: 0.2)
- `gameSpeed`: Controls how fast pipes move (default: 1.3)
- `pipeInterval`: Time between pipes in milliseconds (default: 2500)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Original Flappy Bird concept by Dong Nguyen
- Fonts from Google Fonts
- AWS for hosting services

---

Created with AWS Q CLI  by Vardhan
