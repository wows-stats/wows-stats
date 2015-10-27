# wows-stats
A [XVM](http://www.modxvm.com/en/) like statistics engine for [World of Warships](http://worldofwarships.com/)

# Requirement
You agree that statistics of a player does NOT mean how a player will perform in a game, and you will NOT use this tool in any way to create a toxic environment or demonstrate any unethical/immortal behaviour in World of Warships.
If you do NOT agree, you shall NOT use this app.

[Node.js](https://nodejs.org/en/)

# Installation
1. Make sure you have [Node.js](https://nodejs.org/en/) installed, and you have restarted your computer if you just ran the installation.
2. Make sure you have `replay` enabled in World of Warships.
3. Clone this repo.
4. Run `install.bat`.
5. Edit `.env` in the open Notepad application, and:
  * Change `WOWS_PATH` to where you installed [World of Warships](http://worldofwarships.com/), it is usually the default value `C:\Games\World_of_Warships`.
  * Get an `Application ID` from [Wargaming Developer Room](http://na.wargaming.net/developers/) at your region.
    * **Note**: You can skip this step and `wows-stats` will use the `demo` key, where `Wargaming` has a limit on how many times you can hit their API in a certain period of time using `demo` as a key. I recommend you go ahead and follow the steps, it takes less than a minute and it is totally free.
    * Create an application on [My Applications](https://na.wargaming.net/developers/applications/) page in [Wargaming Developer Room](http://na.wargaming.net/developers/) at your region and copy the newly generated `Application ID`.
    * Add `WOWS_API_KEY=your_api_key` after `WOWS_PATH` in a new line, and replace `your_api_key` with the `Application ID` you copied. 
  * Change `WOWS_API_URL` to the url of `World of Warships API` at your region. (**Without the trailing slash**)(For example, `http://api.worldofwarship.com` for `NA`, `http://api.worldofwarship.eu` for `EU`)
  * Save the change.

# Usage
1. Run `run.bat` to start the app.
2. You should see a web page on ``http://localhost:8080``, make sure only one web page to that address is open at all time.
