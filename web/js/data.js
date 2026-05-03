// ========== SAMPLE DATA ==========
const SPACES = [
  {
    id: 1, name: "Chennai Grand Community Hall", type: "hall", city: "Chennai",
    price: 8000, capacity: 500, rating: 4.8, reviews: 124,
    emoji: "🏛️", available: true,
    amenities: ["AC", "Stage", "Parking", "Catering"],
    description: "Premium air-conditioned community hall ideal for weddings, cultural events and large gatherings.",
    address: "Anna Nagar, Chennai - 600040",
    images: ["🏛️"]
  },
  {
    id: 2, name: "Coimbatore Tech Hub", type: "cowork", city: "Coimbatore",
    price: 500, capacity: 50, rating: 4.7, reviews: 87,
    emoji: "💼", available: true,
    amenities: ["WiFi", "Projector", "Coffee", "Whiteboard"],
    description: "Modern coworking space with high-speed internet, meeting rooms and a vibrant startup community.",
    address: "RS Puram, Coimbatore - 641002",
    images: ["💼"]
  },
  {
    id: 3, name: "Madurai Heritage Auditorium", type: "auditorium", city: "Madurai",
    price: 15000, capacity: 800, rating: 4.9, reviews: 210,
    emoji: "🎭", available: true,
    amenities: ["AC", "Sound System", "Green Room", "LED Screen"],
    description: "Magnificent auditorium with world-class acoustics. Perfect for conferences, shows and seminars.",
    address: "K.K. Nagar, Madurai - 625020",
    images: ["🎭"]
  },
  {
    id: 4, name: "Salem Recording Studio", type: "studio", city: "Salem",
    price: 2000, capacity: 10, rating: 4.6, reviews: 45,
    emoji: "🎙️", available: true,
    amenities: ["Recording Equipment", "Soundproof", "Mixing Console", "Lounge"],
    description: "Professional recording studio with industry-standard equipment for music, podcast and voice-over.",
    address: "Fairlands, Salem - 636016",
    images: ["🎙️"]
  },
  {
    id: 5, name: "Trichy Green Turf", type: "turf", city: "Trichy",
    price: 1200, capacity: 30, rating: 4.5, reviews: 66,
    emoji: "⚽", available: false,
    amenities: ["Flood Lights", "Changing Room", "Parking", "Refreshments"],
    description: "Premium synthetic turf for football, cricket and other outdoor sports activities.",
    address: "Cantonment, Trichy - 620001",
    images: ["⚽"]
  },
  {
    id: 6, name: "Chennai Beach Banquet Hall", type: "banquet", city: "Chennai",
    price: 25000, capacity: 600, rating: 4.8, reviews: 189,
    emoji: "🥂", available: true,
    amenities: ["AC", "Stage", "Valet Parking", "In-house Catering", "Decor"],
    description: "Luxurious banquet hall near the beach. Perfect for receptions, corporate parties and grand dinners.",
    address: "ECR, Chennai - 600119",
    images: ["🥂"]
  }
];

const BOOKINGS_SAMPLE = [
  { id: "BK2026001", space: "Chennai Grand Community Hall", date: "2026-05-10", guests: 200, amount: 8000, status: "confirmed" },
  { id: "BK2026002", space: "Coimbatore Tech Hub", date: "2026-04-25", guests: 12, amount: 500, status: "confirmed" },
  { id: "BK2026003", space: "Madurai Heritage Auditorium", date: "2026-06-01", guests: 400, amount: 15000, status: "pending" }
];
