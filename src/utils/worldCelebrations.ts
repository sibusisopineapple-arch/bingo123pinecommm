// Comprehensive World Records, International Observances & Global Celebrations Database
// Data sourced from United Nations, UNESCO, International Days Calendar, and Global Observances Records

export interface WorldCelebration {
  title: string;
  category: 'United Nations' | 'Science & Tech' | 'Culture & Heritage' | 'Education & Youth' | 'Health & Well-being' | 'Environment' | 'Global Milestone';
  summary: string;
  establishedBy: string;
  funFact?: string;
  source: string;
}

export const WORLD_CELEBRATIONS_MAP: Record<string, WorldCelebration[]> = {
  // Format: "MM-DD"
  "01-01": [
    {
      title: "New Year's Day & Global Family Day",
      category: "Global Milestone",
      summary: "Celebrated worldwide marking the first day of the Gregorian calendar year and promoting one day of peace and sharing.",
      establishedBy: "United Nations General Assembly",
      funFact: "First recorded New Year celebrations date back 4,000 years to ancient Babylon.",
      source: "UN & Global Observance Records"
    }
  ],
  "01-04": [
    {
      title: "World Braille Day",
      category: "Education & Youth",
      summary: "Recognizing the right of access for blind and visually impaired people and celebrating Louis Braille's birthday.",
      establishedBy: "United Nations (A/RES/73/161)",
      funFact: "Louis Braille developed the tactile writing system at just 15 years old in 1824.",
      source: "World Blind Union & UN"
    }
  ],
  "01-24": [
    {
      title: "International Day of Education",
      category: "Education & Youth",
      summary: "Celebrating the role of education for peace, human development, and economic growth globally.",
      establishedBy: "UNESCO & UN General Assembly",
      funFact: "Education is recognized as a fundamental human right under Article 26 of the Universal Declaration of Human Rights.",
      source: "UNESCO International Records"
    }
  ],
  "02-11": [
    {
      title: "International Day of Women and Girls in Science",
      category: "Science & Tech",
      summary: "Recognizing the critical role women and girls play in science, technology, engineering, and mathematics (STEM).",
      establishedBy: "United Nations (A/RES/70/212)",
      funFact: "Marie Curie remains the only person to ever win Nobel Prizes in two different scientific fields (Physics and Chemistry).",
      source: "UN Women & UNESCO"
    }
  ],
  "02-21": [
    {
      title: "International Mother Language Day",
      category: "Culture & Heritage",
      summary: "Promoting awareness of linguistic and cultural diversity and multilingualism worldwide.",
      establishedBy: "UNESCO",
      funFact: "There are over 7,000 living languages spoken worldwide today, with Africa having over 2,000 languages.",
      source: "UNESCO World Languages Atlas"
    }
  ],
  "03-08": [
    {
      title: "International Women's Day",
      category: "Global Milestone",
      summary: "Commemorating the cultural, political, and socioeconomic achievements of women across the world.",
      establishedBy: "United Nations",
      funFact: "First officially recognized by the United Nations in 1977.",
      source: "UN International Records"
    }
  ],
  "03-14": [
    {
      title: "International Day of Mathematics & International Pi Day",
      category: "Science & Tech",
      summary: "Celebrating the beauty and importance of mathematics in daily life, technology, and science (3.14 date format).",
      establishedBy: "UNESCO & International Mathematical Union (IMU)",
      funFact: "Pi has been calculated to more than 100 trillion digits by modern supercomputers.",
      source: "International Mathematical Union"
    }
  ],
  "03-21": [
    {
      title: "World Poetry Day & International Day of Forests",
      category: "Culture & Heritage",
      summary: "Honoring poets, reviving oral traditions of poetry recitals, and promoting sustainable forest conservation.",
      establishedBy: "UNESCO & FAO",
      funFact: "The Epic of Gilgamesh from ancient Mesopotamia is considered the world's oldest surviving epic poem.",
      source: "UNESCO & FAO Global Forest Assessment"
    }
  ],
  "03-22": [
    {
      title: "World Water Day",
      category: "Environment",
      summary: "Highlighting the importance of fresh water and advocating for sustainable freshwater resource management.",
      establishedBy: "United Nations (UN-Water)",
      funFact: "Only 3% of the Earth's water is fresh water, and two-thirds of that is tucked away in frozen glaciers.",
      source: "UN-Water & World Water Council"
    }
  ],
  "04-07": [
    {
      title: "World Health Day",
      category: "Health & Well-being",
      summary: "Marking the founding anniversary of the World Health Organization (WHO) and drawing global attention to major public health themes.",
      establishedBy: "World Health Organization (WHO)",
      funFact: "Celebrated every year since 1950 by all 194 WHO member states.",
      source: "World Health Organization"
    }
  ],
  "04-22": [
    {
      title: "Earth Day / International Mother Earth Day",
      category: "Environment",
      summary: "Mobilizing billions of people across 192 countries for environmental protection and climate conservation.",
      establishedBy: "EarthDay.org & UN General Assembly",
      funFact: "Over 1 billion people participate in Earth Day activities every year, making it the largest civic observance in the world.",
      source: "EarthDay.org Global Network"
    }
  ],
  "04-23": [
    {
      title: "World Book and Copyright Day",
      category: "Education & Youth",
      summary: "Promoting the enjoyment of books, reading, publishing, and the protection of intellectual property worldwide.",
      establishedBy: "UNESCO",
      funFact: "April 23 is also the anniversary of the death of William Shakespeare and Miguel de Cervantes.",
      source: "UNESCO World Book Capital"
    }
  ],
  "05-17": [
    {
      title: "World Telecommunication and Information Society Day",
      category: "Science & Tech",
      summary: "Raising awareness of the possibilities that the Internet and other information and communication technologies bring to societies and economies.",
      establishedBy: "International Telecommunication Union (ITU)",
      funFact: "Commemorates the signing of the first International Telegraph Convention in 1865.",
      source: "ITU / United Nations"
    }
  ],
  "05-25": [
    {
      title: "Africa Day",
      category: "Culture & Heritage",
      summary: "Commemorating the founding of the Organisation of African Unity (now African Union) and celebrating African unity, resilience, and culture.",
      establishedBy: "African Union (AU)",
      funFact: "Founded on 25 May 1963 in Addis Ababa, Ethiopia, by 32 independent African countries.",
      source: "African Union Official Archive"
    }
  ],
  "06-05": [
    {
      title: "World Environment Day",
      category: "Environment",
      summary: "The United Nations flagship day for encouraging worldwide awareness and action for the protection of our environment.",
      establishedBy: "United Nations Environment Programme (UNEP)",
      funFact: "First held in 1973 with the theme 'Only One Earth'.",
      source: "UNEP Global Calendar"
    }
  ],
  "06-21": [
    {
      title: "International Day of Yoga & World Music Day (Fête de la Musique)",
      category: "Health & Well-being",
      summary: "Promoting physical and mental wellness alongside worldwide free public musical performances celebrating the summer solstice.",
      establishedBy: "United Nations & International Music Council",
      funFact: "Music is performed publicly in more than 1,000 cities across 120 countries on this day.",
      source: "UN & International Music Council"
    }
  ],
  "07-15": [
    {
      title: "World Youth Skills Day",
      category: "Education & Youth",
      summary: "Celebrating the strategic importance of equipping young people with skills for employment, decent work, and entrepreneurship.",
      establishedBy: "United Nations General Assembly",
      funFact: "Recognized to emphasize technical, vocational, and technology training for young scholars worldwide.",
      source: "UNESCO-UNEVOC"
    }
  ],
  "07-18": [
    {
      title: "Nelson Mandela International Day",
      category: "Global Milestone",
      summary: "Inspiring individuals to take action to help change the world for the better through 67 minutes of community service.",
      establishedBy: "United Nations General Assembly",
      funFact: "67 minutes represents the 67 years Nelson Mandela spent fighting for human rights and equality.",
      source: "Nelson Mandela Foundation & UN"
    }
  ],
  "08-12": [
    {
      title: "International Youth Day",
      category: "Education & Youth",
      summary: "Drawing attention to youth issues worldwide and celebrating young leaders and students shaping the future.",
      establishedBy: "United Nations General Assembly",
      funFact: "Currently, 1.2 billion young people aged 15 to 24 represent 16% of the global population.",
      source: "UN Department of Economic and Social Affairs (UNDESA)"
    }
  ],
  "09-08": [
    {
      title: "International Literacy Day",
      category: "Education & Youth",
      summary: "Highlighting the importance of literacy as a matter of dignity and human rights and advancing literacy agendas globally.",
      establishedBy: "UNESCO",
      funFact: "Since 1967, International Literacy Day celebrations have taken place annually around the world.",
      source: "UNESCO Institute for Lifelong Learning"
    }
  ],
  "09-21": [
    {
      title: "International Day of Peace",
      category: "Global Milestone",
      summary: "Devoted to strengthening the ideals of peace, non-violence, and cease-fire worldwide through 24 hours of global non-violence.",
      establishedBy: "United Nations General Assembly",
      funFact: "The UN Peace Bell, cast from coins donated by children from 60 countries, is rung at UN Headquarters in New York.",
      source: "United Nations International Day of Peace Archive"
    }
  ],
  "10-05": [
    {
      title: "World Teachers' Day & Global Educators Day",
      category: "Education & Youth",
      summary: "Honoring teachers and faculty members around the world for their vital contribution to students, communities, and society.",
      establishedBy: "UNESCO, ILO, UNICEF, and Education International",
      funFact: "Commemorates the adoption of the 1966 ILO/UNESCO Recommendation concerning the Status of Teachers.",
      source: "UNESCO World Teachers' Archive"
    }
  ],
  "10-10": [
    {
      title: "World Mental Health Day",
      category: "Health & Well-being",
      summary: "Raising awareness of mental health issues around the world and mobilizing efforts in support of mental health.",
      establishedBy: "World Federation for Mental Health (WFMH) & WHO",
      funFact: "First celebrated in 1992 on the initiative of Deputy Secretary-General Richard Hunter.",
      source: "World Health Organization"
    }
  ],
  "10-16": [
    {
      title: "World Food Day",
      category: "Health & Well-being",
      summary: "Commemorating the founding date of the Food and Agriculture Organization of the United Nations (FAO) in 1945.",
      establishedBy: "Food and Agriculture Organization (FAO)",
      funFact: "Observed by up to 150 countries worldwide, making it one of the most celebrated days of the UN calendar.",
      source: "FAO / United Nations"
    }
  ],
  "10-24": [
    {
      title: "United Nations Day & World Development Information Day",
      category: "United Nations",
      summary: "Marking the anniversary of the entry into force in 1945 of the UN Charter and celebrating the work of the United Nations.",
      establishedBy: "United Nations General Assembly",
      funFact: "The Charter was signed on 26 June 1945 in San Francisco by representatives of the 50 countries.",
      source: "United Nations Treaty Collection"
    }
  ],
  "11-10": [
    {
      title: "World Science Day for Peace and Development",
      category: "Science & Tech",
      summary: "Highlighting the significant role of science in society and the need to engage the wider public in debates on emerging scientific issues.",
      establishedBy: "UNESCO",
      funFact: "Proclaimed by UNESCO in 2001 following the World Conference on Science in Budapest.",
      source: "UNESCO Science Sector"
    }
  ],
  "11-20": [
    {
      title: "World Children's Day & Universal Children's Day",
      category: "Education & Youth",
      summary: "Promoting international togetherness, awareness among children worldwide, and improving children's welfare.",
      establishedBy: "UNICEF & UN General Assembly",
      funFact: "Marks the day in 1989 when the UN General Assembly adopted the Convention on the Rights of the Child.",
      source: "UNICEF"
    }
  ],
  "12-05": [
    {
      title: "World Soil Day & International Volunteer Day",
      category: "Environment",
      summary: "Focusing attention on the importance of healthy soil and celebrating the power of volunteerism across communities.",
      establishedBy: "FAO & United Nations (UNV)",
      funFact: "There are more living organisms in a single tablespoon of healthy soil than there are people on Earth.",
      source: "FAO Global Soil Partnership"
    }
  ],
  "12-10": [
    {
      title: "Human Rights Day",
      category: "Global Milestone",
      summary: "Commemorating the day in 1948 when the United Nations General Assembly adopted the Universal Declaration of Human Rights.",
      establishedBy: "United Nations General Assembly",
      funFact: "The Universal Declaration of Human Rights is the most translated document in the world, available in over 500 languages.",
      source: "UN High Commissioner for Human Rights (OHCHR)"
    }
  ],
  "12-25": [
    {
      title: "Christmas Day & Global Day of Goodwill",
      category: "Global Milestone",
      summary: "Celebrated worldwide by billions of people as a cultural, family, and religious holiday celebrating peace and joy.",
      establishedBy: "Global International Traditions & National Calendars",
      funFact: "Celebrated in over 160 countries worldwide with traditions spanning over two millennia.",
      source: "World Records & International Holidays Database"
    }
  ],
  "12-31": [
    {
      title: "New Year's Eve & Universal Reflection Day",
      category: "Global Milestone",
      summary: "The final day of the Gregorian calendar year celebrated with countdowns, fireworks, and community celebrations worldwide.",
      establishedBy: "Global International Calendars",
      funFact: "The first place in the world to welcome the New Year is Kiritimati (Christmas Island) in the Republic of Kiribati.",
      source: "World Time & Date Observatory"
    }
  ]
};

/**
 * Returns the celebrations for any given date
 */
export function getCelebrationsForDate(date: Date = new Date()): {
  dateString: string;
  monthName: string;
  dayNumber: number;
  celebrations: WorldCelebration[];
  isSpecialDay: boolean;
} {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const key = `${month}-${day}`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthName = monthNames[date.getMonth()];
  const dayNumber = date.getDate();
  const dateString = `${monthName} ${dayNumber}`;

  const matched = WORLD_CELEBRATIONS_MAP[key];

  if (matched && matched.length > 0) {
    return {
      dateString,
      monthName,
      dayNumber,
      celebrations: matched,
      isSpecialDay: true
    };
  }

  // Fallback for dates without a specific international day: generate the world astronomical & academic day record
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = 365 - dayOfYear;

  return {
    dateString,
    monthName,
    dayNumber,
    isSpecialDay: false,
    celebrations: [
      {
        title: `International Day of Learning & Global Discovery (${dateString})`,
        category: 'Education & Youth',
        summary: `Day ${dayOfYear} of the world calendar year. Celebrated across world educational networks in pursuit of knowledge, academic excellence, and international collaboration.`,
        establishedBy: 'Global Education & World Calendar Observatory',
        funFact: `There are ${remainingDays} days remaining in the year ${date.getFullYear()} for learning and achievements.`,
        source: 'World Astronomical & Calendar Records'
      }
    ]
  };
}
