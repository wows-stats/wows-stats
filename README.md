# wows-stats-plus
A [XVM](http://www.modxvm.com/en/) like statistics engine for [World of Warships](http://worldofwarships.com/)

Figure 1 - Main window.
![Screenshot](https://i.imgur.com/b3CKQSO.png?1)


Figure 2 - Settings window.
![Screenshot](https://i.imgur.com/fiPjqXI.png?1)

# Functionality
- Show stats information of all matching players and ships on the random battle(pvp).
- Show WTR(Warships.today rating) value.
- Show PR(Personal rating) value.
- Show ships list with (maybe) same order as matching list of game client
- Show value of "Combat power", player's rank of both previous and latest season and the clan tag in addition. 
- You can take a screenshot image and save it to local PC as a png file by click "Capture" button.
- Each player's row is colored like as xvm.
- You can disabled showing all player's name to post the screenshot as public.
- You can see clan information from link at clan tag strings.
- You can see player's information page from link at IGN strings.
- You can select display items from whole ship and player stats items via settings window (Figure 2).
- You can switch stats site link from 5 stats site as follows on IGN strings via settings window (Figure 2).
    "Word of Warships (official)"
    "WoWs Statinfo"
    "WoWs Stats & Nmbers"
    "Warships.Today"
    "WoWStats.org"
- You can select your prefer language by selecting language menu (default is come from your bowser's language setting).
- Support multi-language viewing by preparing translate json file.
    (I provide JSON files to translate for Japanese, English, Chinese(zh-tw) and Russian now.)

# Environment
OS: Windows 7(32bit/64bit) or later.
Web browser: Google Chrome(recommended), Vivaldi, Firefox, Microsoft Edge, and more browser which is incorporated Javascript V8 engine.
    !! CAUSION - Internet Explorer is not supported !!
    !! CAUTION - You need set using web cookie functionality on your browser !!

# Requirement
You agree that statistics of a player does NOT mean how a player will perform in a game, and you will NOT use this tool in any way to create a toxic environment or demonstrate any unethical/immortal behaviour in World of Warships.
If you do NOT agree, you shall NOT use this app.

[Node.js](https://nodejs.org/en/)

# Installation
1. Make sure you have [Node.js](https://nodejs.org/en/) installed, and you have restarted your computer if you just ran the installation.
2. Make sure you have `replay` enabled in World of Warships.
3. Clone this repo.
4. Make sure there is no open web page with address: `http://localhost:8080` 
5. Run `install.bat`.
6. You should see a web page open on `http://localhost:8080`, like this:
![Installation](http://i.imgur.com/0Z2byWH.png)
  * **If you leave or refresh this page, installation will be cancelled, and you will need to run install.bat again.**
  * Change `World of Warships Location` to where you installed [World of Warships](http://worldofwarships.com/), it is usually the default value `C:\Games\World_of_Warships`. Click on `Validate` to make sure the location is correct.
  * Select your `region`.
  * Get an `Application ID` from [Wargaming Developer Room](http://na.wargaming.net/developers/) at your region.
    * Create an application on [My Applications](https://na.wargaming.net/developers/applications/) page in [Wargaming Developer Room](http://na.wargaming.net/developers/) at your region and copy the newly generated `Application ID`.
    * Place `Application ID` you copied into `Application ID` textbox.
    * Click on `Validate` to make sure the `Application ID` you placed works.
  * Click on `Save`. If everything goes through, the installation page will becomes an blank page.

# Usage
1. Run `run.bat` to start the app on your browser. Or run `run_chrome.bat` for only Google Chrome with independent window mode (without menu bar, status bar and so on). And also run `run_vivaldi.bat` for only Vivaldi. If you need, run `run_nocapture.bat` to start the app without capture functionality.
2. You should see a web page open on `http://localhost:8080`, make sure only one web page to that address is open at all time.

# Need cooperation
Because of my poor linguistic ability, anyone please touch up translate text for English and Russian with editing lang_en.json/lang_ru.json file under "static/js/language/".
And also anyone please try to create new JSON files for the other language(Thai(th), and more!) by modifying from lang_ja.json. 

# Acknowledgements
Original wows-stats [tianweiliu](https://github.com/tianweiliu/wows-stats).
zh-tw translation support [AaronChern](https://github.com/AaronChern)
