const CLIMATE_ZONES = [
    'Af', 'Am', 'As', 'Aw',
    'BWk', 'BWh', 'BSk', 'BSh',
    'Cfa', 'Cfb', 'Cfc', 'Csa', 'Csb', 'Csc','Cwa', 'Cwb', 'Cwc',
    'Dfa', 'Dfb', 'Dfc', 'Dfd', 'Dsa', 'Dsb', 'Dsc', 'Dsd', 'Dwa', 'Dwb', 'Dwc', 'Dwd', 
    'EF', 'ET',
];

const CLIMATE_ZONES_MAP = {
    main_climates: {
        A: 'equatorial',
        B: 'arid',
        C: 'warm temperate',
        D: 'snow',
        E: 'polar',
    },
    precipitation: {
        W: 'desert',
        S: 'steppe',
        f: 'wet year-round (fully humid)',
        s: 'summer dry',
        w: 'winter dry',
        m: 'monsoonal',
    },
    temperature: {
        h: 'hot arid',
        k: 'cold arid',
        a: 'hot summer',
        b: 'warm summer',
        c: 'cool summer',
        d: 'very cold winters',
        F: 'polar frost',
        T: 'polar tundra',
    },
    first_letter: {
        A: {
            title: 'Tropical Climates',
            desc: 'Tropical moist climates extend north and south from the equator to about 15° to 25° latitude. In these climates all months have average temperatures greater than 64°F (18°C) and annual precipitation greater than 59.',
        },
        B: {
            title: 'Dry Climates',
            desc: 'The most obvious climatic feature of this climate is that potential evaporation and transpiration exceed precipitation. These climates extend from 20°-35° North and South of the equator and in large continental regions of the mid-latitudes often surrounded by mountains.',
        },
        C: {
            title: 'Moist Subtropical Mid-Latitude Climates',
            desc: 'This climate generally has warm and humid summers with mild winters. Its extent is from 30°50° of latitude mainly on the eastern and western borders of most continents. During the winter, the main weather feature is the mid-latitude cyclone. Convective thunderstorms dominate summer months.',
        },
        D: {
            title: 'Moist Continental Mid-Latitude Climates',
            desc: 'Moist continental mid-latitude climates have warm to cool summers and cold winters. The location of these climates is poleward of the "C" climates. The average temperature of the warmest month is greater than 50°F (10°C), while the coldest month is less than -22°F (-30°C). Winters are severe with snowstorms, strong winds, and bitter cold from Continental Polar or Arctic air masses.',
        },
        E: {
            title: 'Polar Climates',
            desc: 'Polar climates have year-round cold temperatures with the warmest month less than 50°F (10°C). Polar climates are found on the northern coastal areas of North America, Europe, Asia, and on the land masses of Greenland and Antarctica.',
        },
        H: {
            title: 'Highlands',
            desc: 'Unique climates based on their elevation. Highland climates occur in mountainous terrain where rapid elevation changes cause rapid climatic changes over short distances.',
        },
    },
    second_letter: {
        W: 'desert',
        S: 'steppe',
        f: 'wet year-round (fully humid)',
        s: 'dry summer season',
        w: 'dry winter season',
        m: 'monsoon',
    },
    third_letter: {
        h: 'hot arid',
        k: 'cold arid',
        a: 'hot summer',
        b: 'warm summer',
        c: 'cool summer',
        d: 'very cold winters',
        F: 'polar frost',
        T: 'polar tundra',
    },
};

const CLIMATE_ZONES_DESCRIPTION = {
    Af: {
        title: 'Equatorial rainforest',
        desc: 'No dry season. The driest month has at least 2.36 (60 mm) of rain. Rainfall is generally evenly distributed throughout the year. All average monthly temperatures are greater than 64°F (18°C).',
    },
    Am: {
        title: 'Equatorial monsoon',
        desc: 'Pronounced wet season. Short dry season. There are one or more months with less than 2.36 (60 mm). All average monthly temperatures are greater than 64°F (18°C). Highest annual temperature occurs just prior to the rainy season.',
    },
    As: {
        title: 'Equatorial savanna',
        desc: 'Summer dry season. There are more than two months with less than 2.36 (60 mm) in summer. All average monthly temperatures are greater than 64°F (18°C).',
    },
    Aw: {
        title: 'Equatorial savanna',
        desc: 'Winter dry season. There are more than two months with less than 2.36 (60 mm) in winter. All average monthly temperatures are greater than 64°F (18°C).',
    },
    BWk: {
        title: 'Mid-latitude desert',
        desc: 'Mid-latitude desert. Evaporation exceeds precipitation on average but is less than half potential evaporation. Average temperature is less than 64°F (18°C). Winter has below freezing temperatures.',
    },
    BWh: {
        title: 'Subtropical desert',
        desc: 'Low-latitude desert. Evaporation exceeds precipitation on average but is less than half potential evaporation. Average temperature is more than 64°F (18°C). Frost is absent or infrequent.',
    },
    BSk: {
        title: 'Mid-latitude steppe',
        desc: 'Mid-latitude dry. Evaporation exceeds precipitation on average but is less than potential evaporation. Average temperature is less than 64°F (18°C).',
    },
};

module.exports = {
    CLIMATE_ZONES,
    CLIMATE_ZONES_MAP,
    CLIMATE_ZONES_DESCRIPTION,
};