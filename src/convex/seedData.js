// Seed data for cafes and neighborhoods. This mirrors the previous
// front-end hardcoded data so it can be stored and served by Convex.

export const cafeSeed = [
  {
    id: "chye-seng-huat",
    title: "Chye Seng Huat",
    location: "Jalan Besar",
    rating: "4.5",
    price: "$$",
    status: "Visited",
    mrt: "Lavender (EW11) / Bendemeer (DT23)",
    vibe: "Industrial",
    tags: ["Coffee", "Industrial"],
    description:
      "A flagship store of Papa Palheta, Chye Seng Huat Hardware (CSHH) is housed in a conserved Art Deco shophouse. It features a roastery, an island coffee bar, and a C-synopsis of the coffee experience.",
    image:
      "https://images.prestigeonline.com/wp-content/uploads/sites/6/2022/06/27112011/chye-seng-huat-hardware-coffee-1-1348x900.jpeg",
  },
  {
    id: "common-man-coffee",
    title: "Common Man Coffee",
    location: "Robertson Quay",
    rating: "4.7",
    price: "$$$",
    status: "Want to go",
    mrt: "Fort Canning (DT20) Exit A",
    vibe: "Bustling",
    tags: ["Brunch", "Specialty"],
    description:
      "Common Man Coffee Roasters is a specialty coffee roaster, wholesaler, and cafe based in Singapore. They serve all-day brunch and a variety of brewing methods.",
    image:
      "https://commonmancoffeeroasters.com/cdn/shop/files/Grounded_Interior_70b_1024x1024_101d6e96-9b93-431b-b39c-f7a2bf69dfed.webp?v=1680613665&width=1024",
  },
  {
    id: "tiong-bahru-bakery",
    title: "Tiong Bahru Bakery",
    location: "Tiong Bahru",
    rating: "4.6",
    price: "$$",
    status: "Favorite",
    mrt: "Tiong Bahru (EW17) Exit A",
    vibe: "Cozy",
    tags: ["Pastries", "Bakery"],
    description:
      "Known for the best croissants in Singapore, Tiong Bahru Bakery offers a wide range of French pastries and artisanal breads in a cozy neighborhood setting.",
    image:
      "https://danielfooddiary.com/wp-content/uploads/2025/10/tiongbahrubakery15.jpg",
  },
  {
    id: "apartment-coffee",
    title: "Apartment Coffee",
    location: "Bras Basah",
    rating: "4.8",
    price: "$$",
    status: "Want to go",
    mrt: "Rochor (DT13) / Dhoby Ghaut",
    vibe: "Minimalist",
    tags: ["Coffee", "Minimalist"],
    description:
      "A minimalist coffee studio that focuses on the story of each coffee bean. The bright, white space is perfect for a quiet afternoon of reading and sipping.",
    image:
      "https://sprudge.com/wp-content/uploads/2020/07/apartment_singapore_interior_01_beau_badinski.jpg",
  },
  {
    id: "nylon-coffee",
    title: "Nylon Coffee",
    location: "Everton Park",
    rating: "4.9",
    price: "$",
    status: "Visited",
    mrt: "Outram Park (EW16) Exit G",
    vibe: "Community",
    tags: ["Coffee", "Roaster"],
    description:
      "A small, standing-room-only coffee bar and roastery tucked away in a housing estate. Nylon is dedicated to sourcing and roasting exceptional coffees.",
    image: "https://assets.greenguide.sg/prod-1747812509361-Nylon_coffee.jpg",
  },
  {
    id: "homeground-coffee",
    title: "Homeground Coffee",
    location: "Joo Chiat",
    rating: "4.6",
    price: "$$",
    status: "Want to go",
    mrt: "Eunos (EW7) Exit A",
    vibe: "Artsy",
    tags: ["Coffee", "Art"],
    description:
      "A creative space that combines coffee, art, and community. Homeground offers a rotating selection of beans and a gallery space for local artists.",
    image:
      "https://eatbook.sg/wp-content/uploads/2021/03/Organic-Homeground-Coffee-Roasters-by-Mira-3.jpg",
  },
  {
    id: "micro-bakery",
    title: "Micro Bakery",
    location: "Joo Chiat",
    rating: "4.7",
    price: "$$",
    status: "Favorite",
    mrt: "Eunos (EW7) Exit A",
    vibe: "Rustic",
    tags: ["Bakery", "Sourdough"],
    description:
      "Famous for their sourdough bread and cozy atmosphere. The Red House location in Joo Chiat is particularly charming with its heritage architecture.",
    image: "https://sethlui.com/wp-content/uploads/2023/04/MB-7.jpg",
  },
  {
    id: "kurasu",
    title: "Kurasu",
    location: "Bras Basah",
    rating: "4.8",
    price: "$$",
    status: "Visited",
    mrt: "Bras Basah (CC2) Exit A",
    vibe: "Zen",
    tags: ["Japanese", "Minimalist"],
    description:
      "Bringing the Kyoto coffee culture to Singapore. Kurasu serves specialty coffee and sells beautiful Japanese brewing equipment.",
    image:
      "https://eatbook.sg/wp-content/uploads/2023/05/kurasu-singapore-ambience.jpg",
  },
  {
    id: "tobys-estate",
    title: "Toby's Estate",
    location: "Robertson Quay",
    rating: "4.6",
    price: "$$$",
    status: "Visited",
    mrt: "Fort Canning (DT20) Exit A",
    vibe: "Relaxed",
    tags: ["Brunch", "River View"],
    description:
      "An Australian specialty coffee roaster with a prime spot along the Singapore River. Great for people watching and hearty brunch plates.",
    image: "https://danielfooddiary.com/wp-content/uploads/2024/05/tobysestate12.jpg",
  },
  {
    id: "forty-hands",
    title: "Forty Hands",
    location: "Tiong Bahru",
    rating: "4.5",
    price: "$$",
    status: "Visited",
    mrt: "Tiong Bahru (EW17) Exit A",
    vibe: "Casual",
    tags: ["Brunch", "Coffee"],
    description:
      "One of the pioneers of the Singapore cafe scene. Famous for their tau sar pau and strong coffee, it remains a Tiong Bahru staple.",
    image: "https://travelfoodpeople.com/wp-content/uploads/2020/06/IMG_6745.jpeg",
  },
  {
    id: "the-populus",
    title: "The Populus",
    location: "Keong Saik",
    rating: "4.7",
    price: "$$$",
    status: "Favorite",
    mrt: "Outram Park (EW16) Exit F",
    vibe: "Chic",
    tags: ["Gastro-Cafe", "Foodie"],
    description:
      "A gastro-cafe serving elevated brunch dishes and specialty coffee. The food menu is extensive and creative, going beyond standard cafe fare.",
    image:
      "https://lh3.googleusercontent.com/gps-cs-s/AG0ilSz-C-rEOyZU9X3PrpJG_r-_MmCM0ywhWSVrTjlFmzk3EDfwXQ52h1MlxZNI08_GEtwYkKY5s5YPbCG-goXWwthGYwVijf4xHQpNGI_066FTQWs60kdonQof2SLQpBuQeFzEiQA=s1360-w1360-h1020-rw",
  },
  {
    id: "ps-cafe-dempsey",
    title: "PS.Cafe Harding",
    location: "Dempsey Hill",
    rating: "4.6",
    price: "$$$",
    status: "Favorite",
    mrt: "Orchard (NS22) + Taxi",
    vibe: "Romantic",
    tags: ["Greenery", "Upscale"],
    description:
      "A stunning location housed in a colonial building with floor-to-ceiling windows looking out to lush tropical greenery. Famous for their truffle fries and cakes.",
    image:
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgIu2dXDv6eXMns40rUsdOO7FiIP71v3sfHvGr4K3Es7qRew5O0qi_AhdRVF5nyLBfk-oz2DWa9SyDnZU6Bm_Eh3QAg0p1I_qq4d7lEcL9lNtrXoiMEVoloU_HbbIS8XQBYPkRPQZpqs4Ll/s1600/P8240632.JPG",
  },
  {
    id: "sarnies",
    title: "Sarnies",
    location: "Telok Ayer",
    rating: "4.5",
    price: "$$",
    status: "Visited",
    mrt: "Telok Ayer (DT18)",
    vibe: "Bustling",
    tags: ["Aussie", "Brunch"],
    description:
      "An Australian-style cafe in the CBD known for its massive sandwiches, strong coffee, and energetic atmosphere. A hit with the office crowd.",
    image:
      "https://res.klook.com/images/fl_lossy.progressive,q_65/c_fill,w_1295,h_720/w_80,x_15,y_15,g_south_west,l_Klook_water_br_trans_yhcmh3/activities/nau2oar9yzrtiheza1uh/SarniesCafeinRafflesPlace.jpg",
  },
  {
    id: "kafe-utu",
    title: "Kafe Utu",
    location: "Keong Saik",
    rating: "4.7",
    price: "$$$",
    status: "Want to go",
    mrt: "Outram Park (EW16)",
    vibe: "Unique",
    tags: ["African", "Specialty"],
    description:
      "Singapore's first African-themed cafe, serving specialty coffee and soulful food in a beautifully decorated space filled with African art.",
    image:
      "https://hungrygowhere.com/wp-content/uploads/2025/07/09-ev-kafeutu-hungrygowhere.jpg",
  },
  {
    id: "lolas-cafe-holland-v",
    title: "Lola's Cafe",
    location: "Holland Village",
    rating: "4.6",
    price: "$$",
    status: "Favorite",
    mrt: "Holland Village (CC21)",
    vibe: "Warm",
    tags: ["Comfort Food", "Aesthetic"],
    description:
      "The second outlet of the beloved Lola's Cafe, featuring a beautiful Scandinavian-inspired interior and their famous honey paprika wings and brunch plates.",
    image: "https://danielfooddiary.com/wp-content/uploads/2022/08/lolascafe32.jpg",
  },
  {
    id: "penny-university",
    title: "Penny University",
    location: "Siglap",
    rating: "4.5",
    price: "$$",
    status: "Visited",
    mrt: "Kembangan (EW6) + Bus",
    vibe: "Homely",
    tags: ["Halal-Friendly", "Brunch"],
    description:
      "An East Coast stalwart serving specialty coffee and an all-day breakfast menu with a local twist. A cozy spot for the weekend.",
    image:
      "https://eatbook.sg/wp-content/uploads/2022/12/Penny-University-store-interior.jpg",
  },
];

export const neighborhoodSeed = [
  {
    id: "tiong-bahru",
    name: "Tiong Bahru",
    icon: "🥐",
    image:
      "https://images.unsplash.com/photo-1517724391605-7a419c8f074d?w=800&auto=format&fit=crop&q=60",
    description:
      "One of Singapore's oldest housing estates, Tiong Bahru has transformed into a hip enclave of cafes, indie boutiques, and iconic murals, all while retaining its pre-war charm.",
  },
  {
    id: "joo-chiat",
    name: "Joo Chiat",
    icon: "🏠",
    image:
      "https://images.unsplash.com/photo-1627993073739-9304a9193796?w=800&auto=format&fit=crop&q=60",
    description:
      "A vibrant heritage town known for its colorful Peranakan shophouses and traditional eateries. Joo Chiat is a feast for the eyes and the belly.",
  },
  {
    id: "dempsey-hill",
    name: "Dempsey Hill",
    icon: "🌿",
    image:
      "https://images.unsplash.com/photo-1596489397628-9844c83f1236?w=800&auto=format&fit=crop&q=60",
    description:
      "A former military barracks turned premier lifestyle destination, nestled in lush greenery and offering some of the city's best dining experiences.",
  },
  {
    id: "telok-ayer",
    name: "Telok Ayer",
    icon: "🏢",
    image:
      "https://images.unsplash.com/photo-1542263435-08e8264e1236?w=800&auto=format&fit=crop&q=60",
    description:
      "Where business meets pleasure. This bustling CBD district is lined with historic shophouses housing some of the best coffee and brunch spots in town.",
  },
  {
    id: "keong-saik",
    name: "Keong Saik",
    icon: "🏮",
    image:
      "https://images.unsplash.com/photo-1555416042-32bdc6f9661c?w=800&auto=format&fit=crop&q=60",
    description:
      "A vibrant enclave in Chinatown that blends rich heritage with modern dining, famous for its potato head building and award-winning restaurants.",
  },
  {
    id: "holland-village",
    name: "Holland Village",
    icon: "🏘️",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=60",
    description:
      "A long-time favorite for expats and locals, offering a relaxed village vibe with rows of restaurants, cafes, and bars.",
  },
  {
    id: "jalan-besar",
    name: "Jalan Besar",
    icon: "🛠️",
    image:
      "https://images.unsplash.com/photo-1605218427306-022ba8c1a743?w=800&auto=format&fit=crop&q=60",
    description:
      "Raw and industrial, Jalan Besar has evolved into a hipster playground with hardware stores sitting alongside third-wave coffee bars.",
  },
  {
    id: "siglap",
    name: "Siglap",
    icon: "🚲",
    image:
      "https://images.unsplash.com/photo-1523521255535-c3f23c21a48c?w=800&auto=format&fit=crop&q=60",
    description:
      "A laid-back East Coast neighborhood that offers a respite from the city buzz, perfect for slow weekend brunches.",
  },
  {
    id: "bras-basah",
    name: "Bras Basah",
    icon: "🎨",
    image:
      "https://images.unsplash.com/photo-1558866629-6c3e7b876a14?w=800&auto=format&fit=crop&q=60",
    description: "The arts and heritage district, where museums meet modern coffee culture.",
  },
  {
    id: "robertson-quay",
    name: "Robertson Quay",
    icon: "🍷",
    image:
      "https://images.unsplash.com/photo-1518972304856-7494a50d2769?w=800&auto=format&fit=crop&q=60",
    description:
      "Laid-back yet sophisticated, Robertson Quay offers riverside dining and brunch spots perfect for a lazy weekend afternoon.",
  },
  {
    id: "everton-park",
    name: "Everton Park",
    icon: "🌳",
    image:
      "https://images.unsplash.com/photo-1533221975458-158866175787?w=800&auto=format&fit=crop&q=60",
    description:
      "A quiet HDB estate that hides a surprising number of artisanal coffee shops, bakeries, and pottery studios.",
  },
];

