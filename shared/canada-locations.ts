export interface CanadianCity {
  name: string;
  lat: number;
  lng: number;
  population?: number;
  isMetro?: boolean;
  isRemote?: boolean;
  hasFerry?: boolean;
  isNorthern?: boolean;
}

export interface CanadianProvince {
  code: string;
  name: string;
  cities: CanadianCity[];
  regionalMultiplier: number;
  isNorthern?: boolean;
}

export const CANADIAN_PROVINCES: CanadianProvince[] = [
  {
    code: "ON",
    name: "Ontario",
    regionalMultiplier: 1.0,
    cities: [
      { name: "Toronto", lat: 43.6532, lng: -79.3832, population: 2731571, isMetro: true },
      { name: "Ottawa", lat: 45.4215, lng: -75.6972, population: 1017449, isMetro: true },
      { name: "Mississauga", lat: 43.5890, lng: -79.6441, population: 721599, isMetro: true },
      { name: "Brampton", lat: 43.7315, lng: -79.7624, population: 656480, isMetro: true },
      { name: "Hamilton", lat: 43.2557, lng: -79.8711, population: 536917, isMetro: true },
      { name: "London", lat: 42.9849, lng: -81.2453, population: 422324 },
      { name: "Markham", lat: 43.8561, lng: -79.3370, population: 338503, isMetro: true },
      { name: "Vaughan", lat: 43.8361, lng: -79.4983, population: 323103, isMetro: true },
      { name: "Kitchener", lat: 43.4516, lng: -80.4925, population: 256885 },
      { name: "Windsor", lat: 42.3149, lng: -83.0364, population: 229660 },
      { name: "Richmond Hill", lat: 43.8828, lng: -79.4403, population: 202022, isMetro: true },
      { name: "Oakville", lat: 43.4675, lng: -79.6877, population: 193832, isMetro: true },
      { name: "Burlington", lat: 43.3255, lng: -79.7990, population: 186948, isMetro: true },
      { name: "Greater Sudbury", lat: 46.4917, lng: -81.0100, population: 166004 },
      { name: "Oshawa", lat: 43.8971, lng: -78.8658, population: 166000, isMetro: true },
      { name: "Barrie", lat: 44.3894, lng: -79.6903, population: 153356 },
      { name: "St. Catharines", lat: 43.1594, lng: -79.2469, population: 133113 },
      { name: "Cambridge", lat: 43.3616, lng: -80.3144, population: 129920 },
      { name: "Kingston", lat: 44.2312, lng: -76.4860, population: 123798 },
      { name: "Guelph", lat: 43.5448, lng: -80.2482, population: 143740 },
      { name: "Thunder Bay", lat: 48.3809, lng: -89.2477, population: 110172, isRemote: true },
      { name: "Waterloo", lat: 43.4643, lng: -80.5204, population: 113520 },
      { name: "Brantford", lat: 43.1394, lng: -80.2644, population: 104688 },
      { name: "Pickering", lat: 43.8354, lng: -79.0890, population: 99186, isMetro: true },
      { name: "Niagara Falls", lat: 43.0896, lng: -79.0849, population: 94415 },
      { name: "Newmarket", lat: 44.0592, lng: -79.4614, population: 87942, isMetro: true },
      { name: "Peterborough", lat: 44.3091, lng: -78.3197, population: 84230 },
      { name: "Sault Ste. Marie", lat: 46.5136, lng: -84.3358, population: 74566, isRemote: true },
      { name: "Sarnia", lat: 42.9745, lng: -82.4066, population: 72047 },
      { name: "Belleville", lat: 44.1628, lng: -77.3832, population: 55080 },
      { name: "North Bay", lat: 46.3091, lng: -79.4608, population: 52662 },
      { name: "Timmins", lat: 48.4758, lng: -81.3303, population: 42997, isRemote: true },
      { name: "Cornwall", lat: 45.0212, lng: -74.7280, population: 47860 },
      { name: "Chatham-Kent", lat: 42.4048, lng: -82.1910, population: 44074 },
      { name: "Ajax", lat: 43.8509, lng: -79.0204, population: 126666, isMetro: true },
      { name: "Whitby", lat: 43.8975, lng: -78.9429, population: 138501, isMetro: true },
      { name: "Clarington", lat: 43.9350, lng: -78.6083, population: 101427 },
      { name: "Milton", lat: 43.5183, lng: -79.8774, population: 132979, isMetro: true },
      { name: "Aurora", lat: 44.0065, lng: -79.4504, population: 62057, isMetro: true },
      { name: "Welland", lat: 42.9869, lng: -79.2483, population: 55750 },
      { name: "Orillia", lat: 44.6082, lng: -79.4195, population: 33411 },
      { name: "Brockville", lat: 44.5895, lng: -75.6843, population: 21854 },
      { name: "Owen Sound", lat: 44.5671, lng: -80.9434, population: 21612 },
      { name: "Kenora", lat: 49.7667, lng: -94.4833, population: 15096, isRemote: true },
      { name: "Kapuskasing", lat: 49.4156, lng: -82.4331, population: 8292, isRemote: true },
      { name: "Elliot Lake", lat: 46.3814, lng: -82.6472, population: 10741, isRemote: true },
      { name: "Parry Sound", lat: 45.3417, lng: -80.0333, population: 6408 },
      { name: "Muskoka", lat: 45.0667, lng: -79.4833, population: 64000 },
      { name: "Collingwood", lat: 44.5000, lng: -80.2167, population: 24111 },
    ]
  },
  {
    code: "QC",
    name: "Quebec",
    regionalMultiplier: 0.95,
    cities: [
      { name: "Montreal", lat: 45.5017, lng: -73.5673, population: 1762949, isMetro: true },
      { name: "Quebec City", lat: 46.8139, lng: -71.2080, population: 549459, isMetro: true },
      { name: "Laval", lat: 45.6066, lng: -73.7124, population: 438366, isMetro: true },
      { name: "Gatineau", lat: 45.4765, lng: -75.7013, population: 291041, isMetro: true },
      { name: "Longueuil", lat: 45.5312, lng: -73.5185, population: 249277, isMetro: true },
      { name: "Sherbrooke", lat: 45.4042, lng: -71.8929, population: 168011 },
      { name: "Saguenay", lat: 48.4167, lng: -71.0667, population: 147100 },
      { name: "Lévis", lat: 46.8032, lng: -71.1780, population: 147439 },
      { name: "Trois-Rivières", lat: 46.3432, lng: -72.5477, population: 139717 },
      { name: "Terrebonne", lat: 45.7000, lng: -73.6333, population: 121323, isMetro: true },
      { name: "Saint-Jean-sur-Richelieu", lat: 45.3167, lng: -73.2667, population: 98036 },
      { name: "Brossard", lat: 45.4500, lng: -73.4500, population: 89789, isMetro: true },
      { name: "Repentigny", lat: 45.7422, lng: -73.4500, population: 85965, isMetro: true },
      { name: "Drummondville", lat: 45.8833, lng: -72.4833, population: 81035 },
      { name: "Saint-Jérôme", lat: 45.7833, lng: -74.0000, population: 77798 },
      { name: "Granby", lat: 45.4000, lng: -72.7333, population: 68352 },
      { name: "Blainville", lat: 45.6667, lng: -73.8833, population: 61288, isMetro: true },
      { name: "Saint-Hyacinthe", lat: 45.6167, lng: -72.9500, population: 56029 },
      { name: "Châteauguay", lat: 45.3833, lng: -73.7500, population: 50648, isMetro: true },
      { name: "Rimouski", lat: 48.4489, lng: -68.5239, population: 49261 },
      { name: "Victoriaville", lat: 46.0500, lng: -71.9500, population: 47159 },
      { name: "Shawinigan", lat: 46.5667, lng: -72.7500, population: 47858 },
      { name: "Rouyn-Noranda", lat: 48.2333, lng: -79.0167, population: 43630, isRemote: true },
      { name: "Val-d'Or", lat: 48.1000, lng: -77.7833, population: 34268, isRemote: true },
      { name: "Sept-Îles", lat: 50.2000, lng: -66.3833, population: 28534, isRemote: true },
      { name: "Baie-Comeau", lat: 49.2167, lng: -68.1500, population: 21536, isRemote: true },
      { name: "Magog", lat: 45.2667, lng: -72.1500, population: 27571 },
      { name: "Joliette", lat: 46.0167, lng: -73.4333, population: 21089 },
      { name: "Thetford Mines", lat: 46.0833, lng: -71.3000, population: 25709 },
      { name: "Alma", lat: 48.5500, lng: -71.6500, population: 32603 },
      { name: "Amos", lat: 48.5667, lng: -78.1167, population: 12802, isRemote: true },
      { name: "Chibougamau", lat: 49.9167, lng: -74.3667, population: 7504, isRemote: true },
      { name: "Gaspé", lat: 48.8333, lng: -64.4833, population: 14568, isRemote: true },
      { name: "Matane", lat: 48.8500, lng: -67.5333, population: 14462 },
      { name: "Rivière-du-Loup", lat: 47.8333, lng: -69.5333, population: 19714 },
      { name: "Mont-Laurier", lat: 46.5500, lng: -75.5000, population: 14006 },
      { name: "La Tuque", lat: 47.4333, lng: -72.7833, population: 11001, isRemote: true },
    ]
  },
  {
    code: "BC",
    name: "British Columbia",
    regionalMultiplier: 1.15,
    cities: [
      { name: "Vancouver", lat: 49.2827, lng: -123.1207, population: 662248, isMetro: true },
      { name: "Surrey", lat: 49.1913, lng: -122.8490, population: 568322, isMetro: true },
      { name: "Burnaby", lat: 49.2488, lng: -122.9805, population: 249197, isMetro: true },
      { name: "Richmond", lat: 49.1666, lng: -123.1336, population: 209937, isMetro: true },
      { name: "Abbotsford", lat: 49.0504, lng: -122.3045, population: 153524, isMetro: true },
      { name: "Coquitlam", lat: 49.2838, lng: -122.7932, population: 148625, isMetro: true },
      { name: "Kelowna", lat: 49.8880, lng: -119.4960, population: 142146 },
      { name: "Langley", lat: 49.1044, lng: -122.6608, population: 132603, isMetro: true },
      { name: "Saanich", lat: 48.4521, lng: -123.3803, population: 117735, hasFerry: true },
      { name: "Delta", lat: 49.0847, lng: -123.0587, population: 108455, isMetro: true },
      { name: "Victoria", lat: 48.4284, lng: -123.3656, population: 92141, hasFerry: true },
      { name: "Nanaimo", lat: 49.1659, lng: -123.9401, population: 99863, hasFerry: true },
      { name: "Kamloops", lat: 50.6745, lng: -120.3273, population: 100046 },
      { name: "Chilliwack", lat: 49.1579, lng: -121.9514, population: 93203 },
      { name: "Prince George", lat: 53.9171, lng: -122.7497, population: 81155, isRemote: true },
      { name: "Vernon", lat: 50.2671, lng: -119.2720, population: 44519 },
      { name: "Courtenay", lat: 49.6878, lng: -124.9944, population: 28420, hasFerry: true },
      { name: "Campbell River", lat: 50.0244, lng: -125.2475, population: 35138, hasFerry: true },
      { name: "Penticton", lat: 49.4991, lng: -119.5937, population: 36094 },
      { name: "Port Coquitlam", lat: 49.2625, lng: -122.7811, population: 61498, isMetro: true },
      { name: "New Westminster", lat: 49.2069, lng: -122.9110, population: 78916, isMetro: true },
      { name: "Maple Ridge", lat: 49.2194, lng: -122.5984, population: 90990, isMetro: true },
      { name: "North Vancouver", lat: 49.3165, lng: -123.0688, population: 58120, isMetro: true },
      { name: "West Vancouver", lat: 49.3270, lng: -123.1659, population: 44122, isMetro: true },
      { name: "White Rock", lat: 49.0254, lng: -122.8029, population: 21939, isMetro: true },
      { name: "Mission", lat: 49.1336, lng: -122.3115, population: 44261 },
      { name: "Port Moody", lat: 49.2838, lng: -122.8316, population: 33535, isMetro: true },
      { name: "Langford", lat: 48.4472, lng: -123.5055, population: 46584, hasFerry: true },
      { name: "Squamish", lat: 49.7016, lng: -123.1558, population: 23819 },
      { name: "Whistler", lat: 50.1163, lng: -122.9574, population: 13982 },
      { name: "Powell River", lat: 49.8353, lng: -124.5247, population: 13157, hasFerry: true },
      { name: "Cranbrook", lat: 49.5097, lng: -115.7687, population: 21286 },
      { name: "Prince Rupert", lat: 54.3150, lng: -130.3208, population: 12220, isRemote: true, hasFerry: true },
      { name: "Terrace", lat: 54.5164, lng: -128.5997, population: 15723, isRemote: true },
      { name: "Fort St. John", lat: 56.2465, lng: -120.8476, population: 21551, isRemote: true },
      { name: "Dawson Creek", lat: 55.7606, lng: -120.2356, population: 12978, isRemote: true },
      { name: "Kitimat", lat: 54.0500, lng: -128.6500, population: 8131, isRemote: true },
      { name: "Nelson", lat: 49.4928, lng: -117.2948, population: 11220 },
      { name: "Trail", lat: 49.0956, lng: -117.7108, population: 7681 },
      { name: "Williams Lake", lat: 52.1294, lng: -122.1383, population: 10753, isRemote: true },
      { name: "Quesnel", lat: 52.9784, lng: -122.4927, population: 9879, isRemote: true },
      { name: "100 Mile House", lat: 51.6419, lng: -121.2950, population: 2035, isRemote: true },
      { name: "Parksville", lat: 49.3150, lng: -124.3117, population: 13642, hasFerry: true },
      { name: "Comox", lat: 49.6733, lng: -124.9022, population: 15069, hasFerry: true },
      { name: "Duncan", lat: 48.7787, lng: -123.7079, population: 5079, hasFerry: true },
      { name: "Tofino", lat: 49.1530, lng: -125.9066, population: 2104, hasFerry: true, isRemote: true },
    ]
  },
  {
    code: "AB",
    name: "Alberta",
    regionalMultiplier: 1.10,
    cities: [
      { name: "Calgary", lat: 51.0447, lng: -114.0719, population: 1306784, isMetro: true },
      { name: "Edmonton", lat: 53.5461, lng: -113.4938, population: 1010899, isMetro: true },
      { name: "Red Deer", lat: 52.2681, lng: -113.8112, population: 106844 },
      { name: "Lethbridge", lat: 49.6956, lng: -112.8451, population: 101482 },
      { name: "St. Albert", lat: 53.6303, lng: -113.6258, population: 68232, isMetro: true },
      { name: "Medicine Hat", lat: 50.0417, lng: -110.6775, population: 67777 },
      { name: "Grande Prairie", lat: 55.1707, lng: -118.7886, population: 69088, isRemote: true },
      { name: "Airdrie", lat: 51.2917, lng: -114.0144, population: 73580, isMetro: true },
      { name: "Spruce Grove", lat: 53.5450, lng: -113.9008, population: 37645, isMetro: true },
      { name: "Leduc", lat: 53.2649, lng: -113.5492, population: 33935, isMetro: true },
      { name: "Fort McMurray", lat: 56.7264, lng: -111.3803, population: 66573, isRemote: true },
      { name: "Lloydminster", lat: 53.2782, lng: -110.0050, population: 31483, isRemote: true },
      { name: "Camrose", lat: 53.0167, lng: -112.8333, population: 18981 },
      { name: "Brooks", lat: 50.5642, lng: -111.8989, population: 14451 },
      { name: "Cold Lake", lat: 54.4642, lng: -110.1825, population: 15063, isRemote: true },
      { name: "Okotoks", lat: 50.7253, lng: -113.9750, population: 30568, isMetro: true },
      { name: "Cochrane", lat: 51.1892, lng: -114.4669, population: 32199, isMetro: true },
      { name: "Chestermere", lat: 51.0500, lng: -113.8167, population: 22163, isMetro: true },
      { name: "Wetaskiwin", lat: 52.9667, lng: -113.3667, population: 12655 },
      { name: "Lacombe", lat: 52.4681, lng: -113.7369, population: 14152 },
      { name: "Banff", lat: 51.1784, lng: -115.5708, population: 8421 },
      { name: "Canmore", lat: 51.0892, lng: -115.3442, population: 15990 },
      { name: "High River", lat: 50.5833, lng: -113.8667, population: 14518 },
      { name: "Stony Plain", lat: 53.5342, lng: -114.0058, population: 18227, isMetro: true },
      { name: "Fort Saskatchewan", lat: 53.7128, lng: -113.2133, population: 26328, isMetro: true },
      { name: "Hinton", lat: 53.3961, lng: -117.5781, population: 9882 },
      { name: "Jasper", lat: 52.8737, lng: -118.0814, population: 5236 },
      { name: "Peace River", lat: 56.2356, lng: -117.2917, population: 6842, isRemote: true },
      { name: "Slave Lake", lat: 55.2833, lng: -114.7667, population: 6651, isRemote: true },
      { name: "Whitecourt", lat: 54.1422, lng: -115.6833, population: 10574 },
      { name: "Drayton Valley", lat: 53.2225, lng: -114.9739, population: 7614 },
      { name: "High Level", lat: 58.5167, lng: -117.1333, population: 3641, isRemote: true, isNorthern: true },
    ]
  },
  {
    code: "MB",
    name: "Manitoba",
    regionalMultiplier: 1.05,
    cities: [
      { name: "Winnipeg", lat: 49.8951, lng: -97.1384, population: 749534, isMetro: true },
      { name: "Brandon", lat: 49.8483, lng: -99.9500, population: 51313 },
      { name: "Steinbach", lat: 49.5258, lng: -96.6847, population: 17806 },
      { name: "Thompson", lat: 55.7433, lng: -97.8553, population: 13123, isRemote: true, isNorthern: true },
      { name: "Portage la Prairie", lat: 49.9728, lng: -98.2919, population: 13304 },
      { name: "Winkler", lat: 49.1817, lng: -97.9411, population: 14669 },
      { name: "Selkirk", lat: 50.1436, lng: -96.8842, population: 10504 },
      { name: "Morden", lat: 49.1919, lng: -98.1011, population: 10014 },
      { name: "Dauphin", lat: 51.1494, lng: -100.0500, population: 8457 },
      { name: "The Pas", lat: 53.8250, lng: -101.2539, population: 5369, isRemote: true, isNorthern: true },
      { name: "Flin Flon", lat: 54.7681, lng: -101.8781, population: 5185, isRemote: true, isNorthern: true },
      { name: "Swan River", lat: 52.1061, lng: -101.2656, population: 4122, isRemote: true },
      { name: "Stonewall", lat: 50.1342, lng: -97.3261, population: 5150 },
      { name: "Gimli", lat: 50.6347, lng: -96.9906, population: 6181 },
      { name: "Neepawa", lat: 50.2292, lng: -99.4664, population: 4761 },
      { name: "Churchill", lat: 58.7684, lng: -94.1650, population: 899, isRemote: true, isNorthern: true },
    ]
  },
  {
    code: "SK",
    name: "Saskatchewan",
    regionalMultiplier: 1.05,
    cities: [
      { name: "Saskatoon", lat: 52.1332, lng: -106.6700, population: 317480, isMetro: true },
      { name: "Regina", lat: 50.4452, lng: -104.6189, population: 226404, isMetro: true },
      { name: "Prince Albert", lat: 53.2033, lng: -105.7531, population: 37756 },
      { name: "Moose Jaw", lat: 50.3928, lng: -105.5519, population: 35629 },
      { name: "Swift Current", lat: 50.2881, lng: -107.7939, population: 18590 },
      { name: "Yorkton", lat: 51.2139, lng: -102.4628, population: 17000 },
      { name: "North Battleford", lat: 52.7575, lng: -108.2861, population: 14315 },
      { name: "Estevan", lat: 49.1392, lng: -102.9861, population: 11483 },
      { name: "Warman", lat: 52.3219, lng: -106.5842, population: 12500, isMetro: true },
      { name: "Martensville", lat: 52.2897, lng: -106.6675, population: 10000, isMetro: true },
      { name: "Weyburn", lat: 49.6611, lng: -103.8508, population: 11903 },
      { name: "Humboldt", lat: 52.2019, lng: -105.1233, population: 6086 },
      { name: "Melfort", lat: 52.8567, lng: -104.6100, population: 5992 },
      { name: "Lloydminster", lat: 53.2782, lng: -110.0050, population: 19645 },
      { name: "Meadow Lake", lat: 54.1239, lng: -108.4347, population: 5518, isRemote: true },
      { name: "La Ronge", lat: 55.0992, lng: -105.2842, population: 2688, isRemote: true, isNorthern: true },
      { name: "Kindersley", lat: 51.4672, lng: -109.1567, population: 4678 },
      { name: "Nipawin", lat: 53.3653, lng: -104.0086, population: 4274 },
    ]
  },
  {
    code: "NS",
    name: "Nova Scotia",
    regionalMultiplier: 0.95,
    cities: [
      { name: "Halifax", lat: 44.6488, lng: -63.5752, population: 439819, isMetro: true },
      { name: "Dartmouth", lat: 44.6714, lng: -63.5772, population: 93671, isMetro: true },
      { name: "Sydney", lat: 46.1351, lng: -60.1831, population: 29904 },
      { name: "Truro", lat: 45.3647, lng: -63.2800, population: 12261 },
      { name: "New Glasgow", lat: 45.5867, lng: -62.6456, population: 9075 },
      { name: "Glace Bay", lat: 46.1967, lng: -59.9569, population: 16505 },
      { name: "Kentville", lat: 45.0772, lng: -64.4944, population: 6271 },
      { name: "Amherst", lat: 45.8167, lng: -64.2167, population: 9413 },
      { name: "Bridgewater", lat: 44.3772, lng: -64.5181, population: 8532 },
      { name: "Yarmouth", lat: 43.8361, lng: -66.1175, population: 6518 },
      { name: "Antigonish", lat: 45.6167, lng: -61.9833, population: 4524 },
      { name: "Wolfville", lat: 45.0917, lng: -64.3642, population: 4195 },
      { name: "Stellarton", lat: 45.5567, lng: -62.6606, population: 4208 },
      { name: "Digby", lat: 44.6214, lng: -65.7600, population: 2060, hasFerry: true },
      { name: "Lunenburg", lat: 44.3778, lng: -64.3103, population: 2313 },
      { name: "Liverpool", lat: 44.0403, lng: -64.7172, population: 2653 },
      { name: "Pictou", lat: 45.6792, lng: -62.7106, population: 3186, hasFerry: true },
    ]
  },
  {
    code: "NB",
    name: "New Brunswick",
    regionalMultiplier: 0.92,
    cities: [
      { name: "Saint John", lat: 45.2733, lng: -66.0633, population: 70063 },
      { name: "Moncton", lat: 46.0878, lng: -64.7782, population: 79470, isMetro: true },
      { name: "Fredericton", lat: 45.9636, lng: -66.6431, population: 63116 },
      { name: "Dieppe", lat: 46.0989, lng: -64.6822, population: 27588, isMetro: true },
      { name: "Riverview", lat: 46.0614, lng: -64.8050, population: 19667, isMetro: true },
      { name: "Miramichi", lat: 47.0289, lng: -65.4667, population: 17537 },
      { name: "Edmundston", lat: 47.3667, lng: -68.3333, population: 16580 },
      { name: "Bathurst", lat: 47.6197, lng: -65.6511, population: 11897 },
      { name: "Campbellton", lat: 48.0056, lng: -66.6731, population: 6883 },
      { name: "Oromocto", lat: 45.8500, lng: -66.4667, population: 9223 },
      { name: "Woodstock", lat: 46.1517, lng: -67.5997, population: 5254 },
      { name: "Shediac", lat: 46.2236, lng: -64.5394, population: 7019 },
      { name: "Sussex", lat: 45.7222, lng: -65.5106, population: 4282 },
      { name: "Grand Falls", lat: 47.0500, lng: -67.7333, population: 5706 },
      { name: "Caraquet", lat: 47.7792, lng: -64.9253, population: 4248 },
      { name: "Sackville", lat: 45.8989, lng: -64.3675, population: 5331 },
      { name: "Tracadie-Sheila", lat: 47.5136, lng: -64.9181, population: 4568 },
    ]
  },
  {
    code: "NL",
    name: "Newfoundland and Labrador",
    regionalMultiplier: 1.20,
    cities: [
      { name: "St. John's", lat: 47.5615, lng: -52.7126, population: 113948, hasFerry: true },
      { name: "Mount Pearl", lat: 47.5189, lng: -52.8053, population: 22957, hasFerry: true },
      { name: "Corner Brook", lat: 48.9500, lng: -57.9500, population: 19806, hasFerry: true },
      { name: "Conception Bay South", lat: 47.5167, lng: -52.9833, population: 26199, hasFerry: true },
      { name: "Paradise", lat: 47.5333, lng: -52.8667, population: 23298, hasFerry: true },
      { name: "Grand Falls-Windsor", lat: 48.9356, lng: -55.6628, population: 13725, hasFerry: true },
      { name: "Gander", lat: 48.9569, lng: -54.6089, population: 11688, hasFerry: true },
      { name: "Happy Valley-Goose Bay", lat: 53.3017, lng: -60.3261, population: 8109, isRemote: true, hasFerry: true },
      { name: "Labrador City", lat: 52.9500, lng: -66.9167, population: 7220, isRemote: true },
      { name: "Stephenville", lat: 48.5500, lng: -58.5667, population: 6623, hasFerry: true },
      { name: "Carbonear", lat: 47.7333, lng: -53.2167, population: 4630, hasFerry: true },
      { name: "Clarenville", lat: 48.1747, lng: -53.9669, population: 6036, hasFerry: true },
      { name: "Bay Roberts", lat: 47.5972, lng: -53.2653, population: 6012, hasFerry: true },
      { name: "Marystown", lat: 47.1667, lng: -55.1500, population: 5316, hasFerry: true },
      { name: "Port aux Basques", lat: 47.5667, lng: -59.1333, population: 4067, hasFerry: true },
      { name: "Deer Lake", lat: 49.1667, lng: -57.4333, population: 5249, hasFerry: true },
    ]
  },
  {
    code: "PE",
    name: "Prince Edward Island",
    regionalMultiplier: 0.90,
    cities: [
      { name: "Charlottetown", lat: 46.2382, lng: -63.1311, population: 38809 },
      { name: "Summerside", lat: 46.3939, lng: -63.7906, population: 16001 },
      { name: "Stratford", lat: 46.2167, lng: -63.0833, population: 11142 },
      { name: "Cornwall", lat: 46.2333, lng: -63.2167, population: 6574 },
      { name: "Montague", lat: 46.1667, lng: -62.6500, population: 1895 },
      { name: "Kensington", lat: 46.4333, lng: -63.6333, population: 1594 },
      { name: "Souris", lat: 46.3500, lng: -62.2500, population: 1173 },
      { name: "Alberton", lat: 46.8167, lng: -64.0667, population: 1145 },
      { name: "O'Leary", lat: 46.7000, lng: -64.2333, population: 812 },
      { name: "Tignish", lat: 46.9500, lng: -64.0333, population: 738 },
    ]
  },
  {
    code: "YT",
    name: "Yukon",
    regionalMultiplier: 1.45,
    isNorthern: true,
    cities: [
      { name: "Whitehorse", lat: 60.7212, lng: -135.0568, population: 28201, isRemote: true, isNorthern: true },
      { name: "Dawson City", lat: 64.0600, lng: -139.4320, population: 1375, isRemote: true, isNorthern: true },
      { name: "Watson Lake", lat: 60.0631, lng: -128.7106, population: 790, isRemote: true, isNorthern: true },
      { name: "Haines Junction", lat: 60.7522, lng: -137.5111, population: 613, isRemote: true, isNorthern: true },
      { name: "Carmacks", lat: 62.0917, lng: -136.2917, population: 503, isRemote: true, isNorthern: true },
      { name: "Mayo", lat: 63.5936, lng: -135.8942, population: 226, isRemote: true, isNorthern: true },
      { name: "Faro", lat: 62.2264, lng: -133.3486, population: 394, isRemote: true, isNorthern: true },
    ]
  },
  {
    code: "NT",
    name: "Northwest Territories",
    regionalMultiplier: 1.55,
    isNorthern: true,
    cities: [
      { name: "Yellowknife", lat: 62.4540, lng: -114.3718, population: 21330, isRemote: true, isNorthern: true },
      { name: "Hay River", lat: 60.8156, lng: -115.7999, population: 3528, isRemote: true, isNorthern: true },
      { name: "Inuvik", lat: 68.3607, lng: -133.7230, population: 3243, isRemote: true, isNorthern: true },
      { name: "Fort Smith", lat: 60.0047, lng: -111.8711, population: 2542, isRemote: true, isNorthern: true },
      { name: "Behchoko", lat: 62.8025, lng: -116.0478, population: 2060, isRemote: true, isNorthern: true },
      { name: "Fort Simpson", lat: 61.8628, lng: -121.3533, population: 1202, isRemote: true, isNorthern: true },
      { name: "Norman Wells", lat: 65.2817, lng: -126.8328, population: 761, isRemote: true, isNorthern: true },
      { name: "Tuktoyaktuk", lat: 69.4453, lng: -133.0342, population: 898, isRemote: true, isNorthern: true },
    ]
  },
  {
    code: "NU",
    name: "Nunavut",
    regionalMultiplier: 1.75,
    isNorthern: true,
    cities: [
      { name: "Iqaluit", lat: 63.7467, lng: -68.5170, population: 7740, isRemote: true, isNorthern: true },
      { name: "Rankin Inlet", lat: 62.8094, lng: -92.0854, population: 2842, isRemote: true, isNorthern: true },
      { name: "Arviat", lat: 61.1078, lng: -94.0624, population: 2657, isRemote: true, isNorthern: true },
      { name: "Baker Lake", lat: 64.3167, lng: -96.0167, population: 2069, isRemote: true, isNorthern: true },
      { name: "Cambridge Bay", lat: 69.1169, lng: -105.0597, population: 1766, isRemote: true, isNorthern: true },
      { name: "Pond Inlet", lat: 72.7000, lng: -77.9667, population: 1617, isRemote: true, isNorthern: true },
      { name: "Pangnirtung", lat: 66.1458, lng: -65.7128, population: 1504, isRemote: true, isNorthern: true },
      { name: "Igloolik", lat: 69.3772, lng: -81.7986, population: 1682, isRemote: true, isNorthern: true },
      { name: "Gjoa Haven", lat: 68.6358, lng: -95.8775, population: 1324, isRemote: true, isNorthern: true },
      { name: "Kugluktuk", lat: 67.8167, lng: -115.1000, population: 1491, isRemote: true, isNorthern: true },
    ]
  }
];

export function calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateRoadDistance(haversineKm: number): number {
  return haversineKm * 1.35;
}

export function getCityByName(provinceCod: string, cityName: string): CanadianCity | undefined {
  const province = CANADIAN_PROVINCES.find(p => p.code === provinceCod);
  return province?.cities.find(c => c.name === cityName);
}

export function getProvinceByCode(code: string): CanadianProvince | undefined {
  return CANADIAN_PROVINCES.find(p => p.code === code);
}

export interface TransportPricing {
  baseRate: number;
  remoteMultiplier: number;
  ferryCharge: number;
  northernMultiplier: number;
  fuelSurchargePercent: number;
  enclosedMultiplier: number;
  inoperableMultiplier: number;
  minimumCharge: number;
}

export const TRANSPORT_PRICING: TransportPricing = {
  baseRate: 150,
  remoteMultiplier: 1.35,
  ferryCharge: 450,
  northernMultiplier: 1.65,
  fuelSurchargePercent: 5,
  enclosedMultiplier: 1.45,
  inoperableMultiplier: 1.25,
  minimumCharge: 150
};

export const DISTANCE_TIERS = [
  { maxKm: 100, rate: 2.75 },
  { maxKm: 300, rate: 2.00 },
  { maxKm: 500, rate: 1.65 },
  { maxKm: 1000, rate: 1.35 },
  { maxKm: 2000, rate: 1.20 },
  { maxKm: Infinity, rate: 1.00 }
];

export const POPULAR_ROUTE_FLAT_RATES: Record<string, number> = {
  "QC:Montreal-ON:Toronto": 425,
  "ON:Toronto-QC:Montreal": 425,
  "QC:Montreal-ON:Ottawa": 176,
  "ON:Ottawa-QC:Montreal": 176,
  "QC:Quebec City-QC:Montreal": 225,
  "QC:Montreal-QC:Quebec City": 225,
  "ON:Toronto-ON:Ottawa": 350,
  "ON:Ottawa-ON:Toronto": 350
};

export const VOLUME_DISCOUNTS: Record<number, number> = {
  1: 0,
  2: 0.05,
  3: 0.08,
  4: 0.12,
  5: 0.15
};

export function getMultiVehicleDiscount(vehicleCount: number): number {
  if (vehicleCount >= 5) return 0.15;
  return VOLUME_DISCOUNTS[vehicleCount] || 0;
}

function calculateTieredDistance(km: number): number {
  let price = 0;
  let remainingKm = km;
  let prevMax = 0;
  
  for (const tier of DISTANCE_TIERS) {
    const tierKm = Math.min(remainingKm, tier.maxKm - prevMax);
    if (tierKm <= 0) break;
    price += tierKm * tier.rate;
    remainingKm -= tierKm;
    prevMax = tier.maxKm;
    if (remainingKm <= 0) break;
  }
  
  return price;
}

function getPopularRouteFlatRate(originProvince: string, originCity: string, destProvince: string, destCity: string): number | null {
  const routeKey = `${originProvince}:${originCity}-${destProvince}:${destCity}`;
  return POPULAR_ROUTE_FLAT_RATES[routeKey] ?? null;
}

export interface TransportQuote {
  distanceKm: number;
  roadDistanceKm: number;
  basePrice: number;
  distancePrice: number;
  remoteCharge: number;
  ferryCharge: number;
  northernCharge: number;
  fuelSurcharge: number;
  enclosedCharge: number;
  inoperableCharge: number;
  totalPrice: number;
  estimatedDays: number;
  priceBreakdown: { label: string; amount: number }[];
}

export function calculateTransportQuote(
  originProvince: string,
  originCity: string,
  destProvince: string,
  destCity: string,
  options: {
    enclosed?: boolean;
    inoperable?: boolean;
    expedited?: boolean;
    vehicleCount?: number;
  } = {}
): TransportQuote | null {
  const origin = getCityByName(originProvince, originCity);
  const dest = getCityByName(destProvince, destCity);
  const originProv = getProvinceByCode(originProvince);
  const destProv = getProvinceByCode(destProvince);

  if (!origin || !dest || !originProv || !destProv) {
    return null;
  }

  const haversineKm = calculateHaversineDistance(origin.lat, origin.lng, dest.lat, dest.lng);
  const roadKm = calculateRoadDistance(haversineKm);

  const pricing = TRANSPORT_PRICING;
  const priceBreakdown: { label: string; amount: number }[] = [];

  const flatRate = getPopularRouteFlatRate(originProvince, originCity, destProvince, destCity);
  
  let basePrice: number;
  let distancePrice: number;
  
  if (flatRate !== null) {
    basePrice = flatRate;
    distancePrice = 0;
    priceBreakdown.push({ label: `Popular Route (${Math.round(roadKm)} km)`, amount: flatRate });
  } else {
    basePrice = pricing.baseRate;
    distancePrice = calculateTieredDistance(roadKm);
    priceBreakdown.push({ label: "Base Rate", amount: basePrice });
    priceBreakdown.push({ label: `Distance (${Math.round(roadKm)} km)`, amount: distancePrice });
  }

  let remoteCharge = 0;
  if (origin.isRemote || dest.isRemote) {
    remoteCharge = (basePrice + distancePrice) * (pricing.remoteMultiplier - 1);
    priceBreakdown.push({ label: "Remote Area Surcharge", amount: remoteCharge });
  }

  let ferryCharge = 0;
  if (origin.hasFerry || dest.hasFerry) {
    ferryCharge = pricing.ferryCharge;
    if (origin.hasFerry && dest.hasFerry && originProvince !== destProvince) {
      ferryCharge *= 2;
    }
    priceBreakdown.push({ label: "Ferry Crossing", amount: ferryCharge });
  }

  let northernCharge = 0;
  if (origin.isNorthern || dest.isNorthern || originProv.isNorthern || destProv.isNorthern) {
    northernCharge = (basePrice + distancePrice) * (pricing.northernMultiplier - 1);
    priceBreakdown.push({ label: "Northern Territory Surcharge", amount: northernCharge });
  }

  const subtotal = basePrice + distancePrice + remoteCharge + ferryCharge + northernCharge;

  let enclosedCharge = 0;
  if (options.enclosed) {
    enclosedCharge = subtotal * (pricing.enclosedMultiplier - 1);
    priceBreakdown.push({ label: "Enclosed Transport", amount: enclosedCharge });
  }

  let inoperableCharge = 0;
  if (options.inoperable) {
    inoperableCharge = subtotal * (pricing.inoperableMultiplier - 1);
    priceBreakdown.push({ label: "Inoperable Vehicle", amount: inoperableCharge });
  }

  const beforeFuel = subtotal + enclosedCharge + inoperableCharge;
  const fuelSurcharge = beforeFuel * (pricing.fuelSurchargePercent / 100);
  priceBreakdown.push({ label: `Fuel Surcharge (${pricing.fuelSurchargePercent}%)`, amount: fuelSurcharge });

  let expeditedCharge = 0;
  if (options.expedited) {
    expeditedCharge = beforeFuel * 0.35;
    priceBreakdown.push({ label: "Expedited Service", amount: expeditedCharge });
  }

  let volumeDiscount = 0;
  const vehicleCount = options.vehicleCount || 1;
  const discountPercent = getMultiVehicleDiscount(vehicleCount);
  if (discountPercent > 0) {
    volumeDiscount = (beforeFuel + fuelSurcharge + expeditedCharge) * discountPercent;
    const isMaxDiscount = vehicleCount >= 5;
    const discountLabel = isMaxDiscount 
      ? `${Math.round(discountPercent * 100)}% Multi-Vehicle Discount (Maximum)`
      : `${Math.round(discountPercent * 100)}% Multi-Vehicle Discount`;
    priceBreakdown.push({ label: discountLabel, amount: -volumeDiscount });
  }

  let totalPrice = beforeFuel + fuelSurcharge + expeditedCharge - volumeDiscount;
  totalPrice = Math.max(totalPrice, pricing.minimumCharge);

  let estimatedDays = Math.ceil(roadKm / 600) + 1;
  if (origin.isRemote || dest.isRemote) estimatedDays += 1;
  if (origin.isNorthern || dest.isNorthern) estimatedDays += 2;
  if (origin.hasFerry || dest.hasFerry) estimatedDays += 1;
  if (options.expedited) estimatedDays = Math.max(1, Math.ceil(estimatedDays * 0.6));

  return {
    distanceKm: haversineKm,
    roadDistanceKm: roadKm,
    basePrice,
    distancePrice,
    remoteCharge,
    ferryCharge,
    northernCharge,
    fuelSurcharge,
    enclosedCharge,
    inoperableCharge,
    totalPrice: Math.round(totalPrice),
    estimatedDays,
    priceBreakdown: priceBreakdown.map(p => ({ ...p, amount: Math.round(p.amount) }))
  };
}
