# wows-stats-plus
A [XVM](http://www.modxvm.com/en/) like statistics engine for [World of Warships](http://worldofwarships.com/)

![Screenshot](http://i.imgur.com/HANvFgj.png?1)

# Functionality
- Show stats information of all matching players and ships on the random battle.
- Show ships list with (maybe) same order as matching list of game client
- Show value of "Fighting Power(Combat power)" , player's rank of latest season and the clan tag in addition. 
- You can take a screenshot image and save it to local PC as a png file by click "Capture" button.
- Each player's row is colored like as xvm.
- You can disabled showing all player's name to post the screenshot as public.
- Support multi-language viewing by preparing translate json file.
    (I provide JSON files to translate for Japanese, English and Russian now.)

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
    * **Note**: You can skip this step and `wows-stats` will use the `demo` key, where `Wargaming` has a limit on how many times you can hit their API in a certain period of time using `demo` as a key. I recommend you go ahead and follow the steps, it takes less than a minute and it is totally free.
    * Create an application on [My Applications](https://na.wargaming.net/developers/applications/) page in [Wargaming Developer Room](http://na.wargaming.net/developers/) at your region and copy the newly generated `Application ID`.
    * Place `Application ID` you copied into `Application ID` textbox.
    * Click on `Validate` to make sure the `Application ID` you placed works.
  * Click on `Save`. If everything goes through, the installation page will becomes an blank page.

# Usage
1. Run `run.bat` to start the app.
2. You should see a web page open on `http://localhost:8080`, make sure only one web page to that address is open at all time.

# API
* /api
  * GET
  * Response 200:
  ```
  {
    "status": "ok",
    "name": "wows-stats api",
    "version": "v2"
  }
  ```
* /api/player?name=rubycrow
  * GET
  * Response 200:
  ```
  {
    "id": "1001632578",
    "name": "rubycrow",
    "battles": 1343,
    "winRate": "54.28%",
    "avgExp": "1317",
    "avgDmg": "36208",
    "kdRatio": "1.45",
    "raw": {
     ...
    }
  }
  ```
* /api/ship?playerId=1001632578&shipId=4289607376
  * GET
  * Response 200: 
  ```
  {
    "name": "Mutsuki",
    "img": "http://api.worldofwarships.com/static/1.3.2/wows/encyclopedia/vehicle/PJSD005.png",
    "info": {
     ...
    },
    "id": 4289607376,
    "battles": 43,
    "victories": 24,
    "survived": 12,
    "destroyed": 34,
    "avgExp": "1175",
    "avgDmg": "20677",
    "raw": {
     ...
    }
  }
  ```
