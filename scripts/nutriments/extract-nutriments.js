const { writeFileSync } = require('fs');
const food_nutriments = require('../data/food-nutriments.json');

var levers_ = {
    Fiber: {
        needed: 28,
        location: 'base'
    },
    Protein: {
        needed: 52,
        location: 'base'
    },
    Magnesium: {
        needed: 350,
        location: 'mm'
    },
    Calcium: {
        needed: 500,
        location: 'mm'
    },
    Potassium: {
        needed: 3500,
        location: 'mm'
    },
    Phosphorus: {
        needed: 580,
        location: 'mm'
    },
    Iron: {
        needed: 6,
        location: 'mm'
    },
    Zinc: {
        needed: 9.4,
        location: 'mm'
    },
    Copper: {
        needed: 1,
        location: 'mm'
    },
    Manganese: {
        needed: 2.3,
        location: 'base'
    },
    Thiamin: {
        needed: 1,
        location: 'base',
        alt_name: 'Thiamin (Vit B1)'
    },
    Riboflavin: {
        needed: 1.1,
        location: 'base',
        alt_name: 'Riboflavin (Vit B2)'
    },
    Niacin: {
        needed: 12,
        location: 'base',
        alt_name: 'Niacin (Vit B3)'
    },
    "Pantothenic Acid": {
        needed: 5,
        location: 'base',
        alt_name: 'Pantothenic Acid (B5)'
    },
    Selenium: {
        needed: 45,
        location: 'base'
    },
    "Vitamin A - RAE": {
        needed: 625,
        location: 'vitamins'
    },
    "Vitamin B6": {
        needed: 1.1,
        location: 'vitamins'
    },
    "Vitamin B12": {
        needed: 2,
        location: 'vitamins'
    },
    "Vitamin C": {
        needed: 75,
        location: 'vitamins'
    },
    "Vitamin E": {
        needed: 12,
        location: 'vitamins'
    },
    "Vitamin K": {
        needed: 80,
        location: 'vitamins'
    },
    Choline: {
        needed: 425,
        location: 'base'
    }
};
var min_levers_ = {
    "saturated fat": 12,
    "sugar": 50,
    "sodium": 1500,
    "calcium": 500,
    "potassium": 3500,
    "fat": 60,
    "carbohydrate": 300,
    "protein": 52,
    "caloric density": "numeric"
};
var get_total_calories_ = function(dat_original) {
    var Fat = 0, mf, pf, sf;
    if (+dat_original['Monosaturated Fat'] === 0 || +dat_original['Polysaturated Fat'] === 0 || +dat_original['Saturated Fat'] === 0) {
        Fat = dat_original['Total Lipid'];
    } else {
        mf = 9 * +dat_original['Monosaturated Fat'];
        pf = 9 * +dat_original['Polysaturated Fat'];
        sf = 9 * +dat_original['Saturated Fat'];
        Fat = mf + pf + sf;
    }
    var carb_cals = dat_original.Carboydrate * 4;
    var prot_cals = dat_original.Protein * 4;
    return prot_cals + carb_cals + Fat;
};
var get_percent_normalized_ = function(dat_original_arg, normalize_to) {
    var dat_original = { ...dat_original_arg };
    var multiplier = normalize_to / dat_original.Kilocalories;
    var dat = {};
    dat_original.Total_Calculated_Calories = get_total_calories_(dat_original);
    dat_original.Kilocalories = Math.round(multiplier * dat_original.Kilocalories);
    dat_original.Protein = round_100_(multiplier * dat_original.Protein, 'g');
    dat_original.Carboydrate = round_100_(multiplier * dat_original.Carboydrate, 'g');
    dat_original.Fiber = round_100_(multiplier * dat_original.Fiber, 'g');
    dat_original['Sugar Total'] = round_100_(multiplier * dat_original['Sugar Total'], 'g');
    dat_original.Cholesterol = round_(dat_original.Cholesterol);
    var weight = dat_original.original_weight || 100;
    var calories = dat_original.original_calories || dat_original_arg.Kilocalories;
    dat_original.caloric_density = round_100_(calories / weight);
    dat_original['Total Lipid'] = round_100_(multiplier * dat_original['Total Lipid'], 'g');
    dat_original["Monosaturated Fat"] = round_100_(multiplier * dat_original["Monosaturated Fat"], 'g');
    dat_original["Polysaturated Fat"] = round_100_(multiplier * dat_original["Polysaturated Fat"], 'g');
    dat_original["Saturated Fat"] = round_100_(multiplier * dat_original["Saturated Fat"], 'g');
    dat_original.Copper = round_100_(dat_original.Copper * multiplier);
    dat_original.Iron = round_10_(dat_original.Iron * multiplier);
    dat_original.Sodium = round_(dat_original.Sodium * multiplier);
    dat_original.Potassium = round_(dat_original.Potassium * multiplier);
    dat_original.Calcium = round_(dat_original.Calcium * multiplier);
    dat_original.Magnesium = round_(dat_original.Magnesium * multiplier);
    dat_original.Zinc = round_100_(dat_original.Zinc * multiplier);
    dat_original.Phosphorus = round_(dat_original.Phosphorus * multiplier);
    dat_original.Manganese = round_100_(dat_original.Manganese * multiplier);
    dat_original.Selenium = round_100_(dat_original.Selenium * multiplier);
    dat_original["Vitamin A - RAE"] = round_(dat_original["Vitamin A - RAE"] * multiplier);
    dat_original["Vitamin C"] = round_(dat_original["Vitamin C"] * multiplier);
    dat_original["Vitamin E"] = round_100_(dat_original["Vitamin E"] * multiplier);
    dat_original["Vitamin K"] = round_(dat_original["Vitamin K"] * multiplier);
    dat_original["Vitamin B6"] = round_100_(dat_original["Vitamin B6"] * multiplier);
    dat_original["Vitamin B12"] = round_100_(dat_original["Vitamin B12"] * multiplier);
    dat_original["Thiamin"] = round_100_(dat_original["Thiamin"] * multiplier);
    dat_original["Riboflavin"] = round_100_(dat_original["Riboflavin"] * multiplier);
    dat_original["Niacin"] = round_100_(dat_original["Niacin"] * multiplier);
    dat_original["Pantothenic Acid"] = round_100_(dat_original["Pantothenic Acid"] * multiplier);
    dat_original["Choline"] = round_100_(dat_original["Choline"] * multiplier);
    dat['Fiber'] = final_(dat_original_arg.Fiber * multiplier / levers_['Fiber'].needed);
    dat = {};
    dat.Copper = final_((dat_original.Copper) / levers_['Copper'].needed);
    dat.Iron = final_((dat_original.Iron) / levers_['Iron'].needed);
    dat.Sodium = final_((dat_original.Sodium) / min_levers_.sodium);
    dat.Potassium = final_((dat_original.Potassium) / levers_['Potassium'].needed);
    dat.Calcium = final_((dat_original.Calcium) / levers_['Calcium'].needed);
    dat.Magnesium = final_((dat_original.Magnesium) / levers_['Magnesium'].needed);
    dat.Zinc = final_((dat_original.Zinc) / levers_['Zinc'].needed);
    dat.Phosphorus = final_((dat_original.Phosphorus) / levers_['Phosphorus'].needed);
    dat.Manganese = final_((dat_original.Manganese) / levers_['Manganese'].needed);
    dat.Selenium = final_((dat_original.Selenium) / levers_['Selenium'].needed);
    dat["Vitamin A - RAE"] = final_((dat_original["Vitamin A - RAE"]) / levers_["Vitamin A - RAE"].needed);
    dat["Vitamin C"] = final_((dat_original["Vitamin C"]) / levers_["Vitamin C"].needed);
    dat["Vitamin E"] = final_((dat_original["Vitamin E"]) / levers_["Vitamin E"].needed);
    dat["Vitamin K"] = final_((dat_original["Vitamin K"]) / levers_["Vitamin K"].needed);
    dat["Vitamin B6"] = final_((dat_original["Vitamin B6"]) / levers_["Vitamin B6"].needed);
    dat["Vitamin B12"] = final_((dat_original["Vitamin B12"]) / levers_["Vitamin B12"].needed);
    dat["Thiamin"] = final_10_((dat_original["Thiamin"]) / levers_["Thiamin"].needed);
    dat["Riboflavin"] = final_10_((dat_original["Riboflavin"]) / levers_["Riboflavin"].needed);
    dat["Niacin"] = final_10_((dat_original["Niacin"]) / levers_["Niacin"].needed);
    dat["Pantothenic Acid"] = final_10_((dat_original["Pantothenic Acid"]) / levers_["Pantothenic Acid"].needed);
    dat["Choline"] = final_((dat_original["Choline"]) / levers_["Choline"].needed);
    dat_original.percent = dat;
    return dat_original;
};
var round_ = function(s) {
    return +s === 0 ? "" : Math.round(s);
};
var round_100_ = function(s, suf) {
    var suffix = suf || "";
    return +s === 0 ? "" : (Math.round(s * 100) / 100 + suffix);
};
var round_10_ = function(s) {
    return +s === 0 ? "" : Math.round(s * 10) / 10;
};
var final_ = function(s) {
    s = s * 100;
    var t = Math.round(s);
    return t === 0 ? "" : t + '%';
};
var final_10_ = function(s) {
    s = s * 100;
    var t = Math.round(s * 10) / 10;
    return t === 0 ? "" : t + '%';
};
function toTitleCase_(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

var translate_one_food_ = function(arr) {
    const calories = arr[41];
    const original_calories = arr[47];
    const ratio = calories / original_calories;

    var data = {};
    data["Niacin"] = arr[4]/ ratio;
    data["Copper"] = arr[5]/ ratio;
    data.Iron = arr[6] /ratio;
    data.Sodium = arr[7] / ratio;
    data.Potassium = arr[8] / ratio;
    data.Calcium = arr[9]/ratio;
    data.Magnesium = arr[10]/ratio;
    data.Zinc = arr[11]/ratio;
    data.Phosphorus = arr[12]/ratio;
    data["Vitamin A - IU"] = arr[13]/ratio;
    data["Vitamin C"] = arr[14]/ratio;
    data["Vitamin B12"] = arr[15]/ratio;
    data["Vitamin B6"] = arr[16]/ratio;
    data["Vitamin A - RAE"] = arr[17]/ratio;
    data["Vitamin E"] = arr[18]/ratio;
    data["Vitamin K"] = arr[19]/ratio;
    data["Carboydrate"] = arr[20]/ratio;
    data["Selenium"] = arr[21]/ratio;
    data["Thiamin"] = arr[22]/ratio;
    data["Choline"] = arr[23]/ratio;
    data["Beta Carotene"] = arr[24]/ratio;
    data["Fiber"] = arr[25]/ratio;
    data["Saturated Fat"] = arr[26]/ratio;
    data["Monosaturated Fat"] = arr[27]/ratio;
    data["Total Lipid"] = arr[28]/ratio;
    data["Polysaturated Fat"] = arr[29]/ratio;
    data["Water"] = arr[30]/ratio;
    data["Lycopene"] = arr[31]/ratio;
    data["Pantothenic Acid"] = arr[32]/ratio;
    data["Ash"] = arr[33]/ratio;
    data["Alpha Carotene"] = arr[34]/ratio;
    data["Retinol"] = arr[35]/ratio;
    data["Manganese"] = arr[36]/ratio;
    data["Beta Cryptoxanthin"] = arr[37]/ratio;
    data["Riboflavin"] = arr[38]/ratio;
    data["Cholesterol"] = arr[39]/ratio;
    data["Lutein and Zeaxanthin"] = arr[40]/ratio;
    data["Kilocalories"] = original_calories;
    // data["Kilocalories"] = arr[41];
    data["Sugar Total"] = arr[42]/ratio;
    data["Protein"] = arr[43]/ratio;
    // data["desc"] = arr[44];
    // data["ndbn_ingredients"] = arr[45];
    // data["link"] = arr[46];
    // data["original_calories"] = arr[47];
    data["original_weight"] = arr[48];
    // data["author"] = arr[49];
    // data["website_name"] = arr[50];
    // set_booleans_(data, arr[51]);
    data["is_vegan"] = arr[52];
    // if (data['desc'] && data["desc"].trim() !== "" && data['link'].trim() !== "") {
    //     var new_arr = data['link'].split("/");
    //     var www = new_arr[0] + "//" + new_arr[2];
    //     data['desc'] = "From <a target='nofollow' target='_blank' href='" + www + "'>" + www + '</a>:';
    // }
    return {
        "name": arr[0].toLowerCase(),
        "description": arr[1].toLowerCase().split(','),
        // "Nutrient Data Bank Number": arr[2],
        // "spice": arr[3],
        data,
    };
};
var set_booleans_ = function(data, bool_string) {
    for (var x in Settings.CHECKBOXES) {
        var filter_name = Settings.CHECKBOXES[x];
        if (filter_name !== 'vegan') {
            data[filter_name] = +bool_string.charAt(x) === 1 ? true : false;
        }
    }
};
var full_selected_food_ = 0
  , full_selected_recipe_ = 0;
var get_ = function() {
    if (!full_selected_food_) {
        full_selected_food_ = [];
        full_selected_recipe_ = [];
        for (var x = 0; x < selected_food.length; x++) {
            full_selected_food_[x] = translate_one_food_(selected_food[x]);
        }
    }
    return full_selected_food_;
};

const createMap = () => {
    const food = food_nutriments.map(translate_one_food_);
    writeFileSync('constants/data/nutrients.json', JSON.stringify(food, null, 2));
};

createMap();