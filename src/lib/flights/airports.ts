/**
 * Airport database for autocomplete functionality
 * Source: Curated from OurAirports dataset (public domain)
 * Focus: Major commercial airports worldwide with emphasis on Americas
 */

export interface Airport {
  iata: string
  name: string
  city: string
  country: string
  keywords?: string[]
}

/**
 * Curated list of ~400 major airports worldwide
 * Prioritized: Americas, Europe, major international hubs
 */
export const AIRPORTS: Airport[] = [
  // ============================================
  // CARIBBEAN & PUERTO RICO
  // ============================================
  { iata: "SJU", name: "Luis Muñoz Marín International", city: "San Juan", country: "Puerto Rico", keywords: ["carolina", "puerto rico"] },
  { iata: "BQN", name: "Rafael Hernández International", city: "Aguadilla", country: "Puerto Rico" },
  { iata: "PSE", name: "Mercedita International", city: "Ponce", country: "Puerto Rico" },
  { iata: "SIG", name: "Fernando Luis Ribas Dominicci", city: "Isla Grande", country: "Puerto Rico", keywords: ["san juan"] },
  { iata: "STT", name: "Cyril E. King Airport", city: "St. Thomas", country: "US Virgin Islands", keywords: ["charlotte amalie"] },
  { iata: "STX", name: "Henry E. Rohlsen Airport", city: "St. Croix", country: "US Virgin Islands", keywords: ["christiansted"] },
  { iata: "SXM", name: "Princess Juliana International", city: "St. Maarten", country: "Sint Maarten" },
  { iata: "AUA", name: "Queen Beatrix International", city: "Oranjestad", country: "Aruba" },
  { iata: "CUR", name: "Hato International", city: "Willemstad", country: "Curaçao" },
  { iata: "BON", name: "Flamingo International", city: "Kralendijk", country: "Bonaire" },
  { iata: "POS", name: "Piarco International", city: "Port of Spain", country: "Trinidad and Tobago" },
  { iata: "BGI", name: "Grantley Adams International", city: "Bridgetown", country: "Barbados" },
  { iata: "UVF", name: "Hewanorra International", city: "Vieux Fort", country: "Saint Lucia" },
  { iata: "SLU", name: "George F. L. Charles Airport", city: "Castries", country: "Saint Lucia" },
  { iata: "PTP", name: "Pointe-à-Pitre International", city: "Pointe-à-Pitre", country: "Guadeloupe" },
  { iata: "FDF", name: "Martinique Aimé Césaire International", city: "Fort-de-France", country: "Martinique" },
  { iata: "ANU", name: "V.C. Bird International", city: "St. John's", country: "Antigua and Barbuda" },
  { iata: "SKB", name: "Robert L. Bradshaw International", city: "Basseterre", country: "St. Kitts and Nevis" },
  { iata: "DOM", name: "Douglas-Charles Airport", city: "Roseau", country: "Dominica" },
  { iata: "GND", name: "Maurice Bishop International", city: "St. George's", country: "Grenada" },
  { iata: "SVD", name: "Argyle International", city: "Kingstown", country: "St. Vincent and the Grenadines" },
  { iata: "TAB", name: "Tobago International", city: "Scarborough", country: "Trinidad and Tobago" },

  // ============================================
  // DOMINICAN REPUBLIC
  // ============================================
  { iata: "SDQ", name: "Las Américas International", city: "Santo Domingo", country: "Dominican Republic" },
  { iata: "PUJ", name: "Punta Cana International", city: "Punta Cana", country: "Dominican Republic" },
  { iata: "STI", name: "Cibao International", city: "Santiago de los Caballeros", country: "Dominican Republic" },
  { iata: "POP", name: "Gregorio Luperón International", city: "Puerto Plata", country: "Dominican Republic" },
  { iata: "LRM", name: "Casa de Campo International", city: "La Romana", country: "Dominican Republic" },
  { iata: "EPS", name: "María Montez International", city: "Barahona", country: "Dominican Republic" },

  // ============================================
  // CUBA, JAMAICA, HAITI, BAHAMAS
  // ============================================
  { iata: "HAV", name: "José Martí International", city: "Havana", country: "Cuba", keywords: ["la habana"] },
  { iata: "VRA", name: "Juan Gualberto Gómez International", city: "Varadero", country: "Cuba" },
  { iata: "HOG", name: "Frank País International", city: "Holguín", country: "Cuba" },
  { iata: "SCU", name: "Antonio Maceo International", city: "Santiago de Cuba", country: "Cuba" },
  { iata: "MBJ", name: "Sangster International", city: "Montego Bay", country: "Jamaica" },
  { iata: "KIN", name: "Norman Manley International", city: "Kingston", country: "Jamaica" },
  { iata: "PAP", name: "Toussaint Louverture International", city: "Port-au-Prince", country: "Haiti" },
  { iata: "CAP", name: "Cap-Haïtien International", city: "Cap-Haïtien", country: "Haiti" },
  { iata: "NAS", name: "Lynden Pindling International", city: "Nassau", country: "Bahamas" },
  { iata: "FPO", name: "Grand Bahama International", city: "Freeport", country: "Bahamas" },
  { iata: "GGT", name: "Exuma International", city: "George Town", country: "Bahamas" },
  { iata: "GCM", name: "Owen Roberts International", city: "George Town", country: "Cayman Islands", keywords: ["grand cayman"] },
  { iata: "BDA", name: "L.F. Wade International", city: "Hamilton", country: "Bermuda" },

  // ============================================
  // CENTRAL AMERICA
  // ============================================
  // Costa Rica
  { iata: "SJO", name: "Juan Santamaría International", city: "San José", country: "Costa Rica", keywords: ["alajuela"] },
  { iata: "LIR", name: "Daniel Oduber Quirós International", city: "Liberia", country: "Costa Rica", keywords: ["guanacaste"] },
  { iata: "LIO", name: "Limón International", city: "Limón", country: "Costa Rica" },
  { iata: "PMZ", name: "Palmar Sur Airport", city: "Palmar Sur", country: "Costa Rica" },

  // Panama
  { iata: "PTY", name: "Tocumen International", city: "Panama City", country: "Panama", keywords: ["ciudad de panama"] },
  { iata: "PAC", name: "Albrook Marcos A. Gelabert International", city: "Panama City", country: "Panama" },
  { iata: "DAV", name: "Enrique Malek International", city: "David", country: "Panama" },
  { iata: "BLB", name: "Bocas del Toro International", city: "Bocas del Toro", country: "Panama" },

  // Guatemala
  { iata: "GUA", name: "La Aurora International", city: "Guatemala City", country: "Guatemala", keywords: ["ciudad de guatemala"] },
  { iata: "FRS", name: "Mundo Maya International", city: "Flores", country: "Guatemala", keywords: ["tikal", "peten"] },

  // El Salvador
  { iata: "SAL", name: "Monseñor Óscar Arnulfo Romero International", city: "San Salvador", country: "El Salvador", keywords: ["comalapa"] },

  // Honduras
  { iata: "TGU", name: "Toncontín International", city: "Tegucigalpa", country: "Honduras" },
  { iata: "SAP", name: "Ramón Villeda Morales International", city: "San Pedro Sula", country: "Honduras" },
  { iata: "RTB", name: "Juan Manuel Gálvez International", city: "Roatán", country: "Honduras" },
  { iata: "LCE", name: "Golosón International", city: "La Ceiba", country: "Honduras" },

  // Nicaragua
  { iata: "MGA", name: "Augusto C. Sandino International", city: "Managua", country: "Nicaragua" },
  { iata: "BEF", name: "Bluefields Airport", city: "Bluefields", country: "Nicaragua" },

  // Belize
  { iata: "BZE", name: "Philip S.W. Goldson International", city: "Belize City", country: "Belize" },
  { iata: "TZA", name: "Belize City Municipal", city: "Belize City", country: "Belize" },

  // ============================================
  // MEXICO
  // ============================================
  { iata: "MEX", name: "Mexico City International", city: "Mexico City", country: "Mexico", keywords: ["ciudad de mexico", "cdmx", "benito juarez"] },
  { iata: "CUN", name: "Cancún International", city: "Cancún", country: "Mexico", keywords: ["quintana roo"] },
  { iata: "GDL", name: "Miguel Hidalgo y Costilla International", city: "Guadalajara", country: "Mexico", keywords: ["jalisco"] },
  { iata: "MTY", name: "General Mariano Escobedo International", city: "Monterrey", country: "Mexico", keywords: ["nuevo leon"] },
  { iata: "TIJ", name: "General Abelardo L. Rodríguez International", city: "Tijuana", country: "Mexico" },
  { iata: "SJD", name: "Los Cabos International", city: "San José del Cabo", country: "Mexico", keywords: ["cabo san lucas"] },
  { iata: "PVR", name: "Gustavo Díaz Ordaz International", city: "Puerto Vallarta", country: "Mexico", keywords: ["jalisco"] },
  { iata: "ACA", name: "General Juan N. Álvarez International", city: "Acapulco", country: "Mexico" },
  { iata: "HMO", name: "General Ignacio Pesqueira García International", city: "Hermosillo", country: "Mexico" },
  { iata: "CUU", name: "General Roberto Fierro Villalobos International", city: "Chihuahua", country: "Mexico" },
  { iata: "MID", name: "Manuel Crescencio Rejón International", city: "Mérida", country: "Mexico", keywords: ["yucatan"] },
  { iata: "BJX", name: "Guanajuato International", city: "León", country: "Mexico", keywords: ["guanajuato", "bajio"] },
  { iata: "ZIH", name: "Ixtapa-Zihuatanejo International", city: "Zihuatanejo", country: "Mexico" },
  { iata: "OAX", name: "Xoxocotlán International", city: "Oaxaca", country: "Mexico" },
  { iata: "VSA", name: "Carlos Rovirosa Pérez International", city: "Villahermosa", country: "Mexico" },
  { iata: "VER", name: "General Heriberto Jara International", city: "Veracruz", country: "Mexico" },
  { iata: "PBC", name: "Hermanos Serdán International", city: "Puebla", country: "Mexico" },
  { iata: "CZM", name: "Cozumel International", city: "Cozumel", country: "Mexico" },
  { iata: "QRO", name: "Querétaro Intercontinental", city: "Querétaro", country: "Mexico" },
  { iata: "SLP", name: "Ponciano Arriaga International", city: "San Luis Potosí", country: "Mexico" },
  { iata: "AGU", name: "Jesús Terán Peredo International", city: "Aguascalientes", country: "Mexico" },
  { iata: "CJS", name: "Abraham González International", city: "Ciudad Juárez", country: "Mexico" },
  { iata: "TRC", name: "Francisco Sarabia International", city: "Torreón", country: "Mexico" },
  { iata: "MZT", name: "General Rafael Buelna International", city: "Mazatlán", country: "Mexico" },
  { iata: "TAM", name: "General Francisco Javier Mina International", city: "Tampico", country: "Mexico" },
  { iata: "ZLO", name: "Playa de Oro International", city: "Manzanillo", country: "Mexico" },
  { iata: "LAP", name: "Manuel Márquez de León International", city: "La Paz", country: "Mexico", keywords: ["baja california sur"] },
  { iata: "TUY", name: "Tulum International", city: "Tulum", country: "Mexico" },

  // ============================================
  // SOUTH AMERICA
  // ============================================
  // Colombia
  { iata: "BOG", name: "El Dorado International", city: "Bogotá", country: "Colombia" },
  { iata: "MDE", name: "José María Córdova International", city: "Medellín", country: "Colombia", keywords: ["rionegro"] },
  { iata: "CTG", name: "Rafael Núñez International", city: "Cartagena", country: "Colombia" },
  { iata: "CLO", name: "Alfonso Bonilla Aragón International", city: "Cali", country: "Colombia" },
  { iata: "BAQ", name: "Ernesto Cortissoz International", city: "Barranquilla", country: "Colombia" },
  { iata: "SMR", name: "Simón Bolívar International", city: "Santa Marta", country: "Colombia" },
  { iata: "ADZ", name: "Gustavo Rojas Pinilla International", city: "San Andrés", country: "Colombia" },
  { iata: "PEI", name: "Matecaña International", city: "Pereira", country: "Colombia" },
  { iata: "BGA", name: "Palonegro International", city: "Bucaramanga", country: "Colombia" },

  // Venezuela
  { iata: "CCS", name: "Simón Bolívar International", city: "Caracas", country: "Venezuela", keywords: ["maiquetia"] },
  { iata: "MAR", name: "La Chinita International", city: "Maracaibo", country: "Venezuela" },
  { iata: "VLN", name: "Arturo Michelena International", city: "Valencia", country: "Venezuela" },
  { iata: "PMV", name: "Santiago Mariño International", city: "Isla Margarita", country: "Venezuela" },

  // Ecuador
  { iata: "UIO", name: "Mariscal Sucre International", city: "Quito", country: "Ecuador" },
  { iata: "GYE", name: "José Joaquín de Olmedo International", city: "Guayaquil", country: "Ecuador" },
  { iata: "CUE", name: "Mariscal Lamar International", city: "Cuenca", country: "Ecuador" },
  { iata: "GPS", name: "Seymour Airport", city: "Baltra", country: "Ecuador", keywords: ["galapagos"] },

  // Peru
  { iata: "LIM", name: "Jorge Chávez International", city: "Lima", country: "Peru" },
  { iata: "CUZ", name: "Alejandro Velasco Astete International", city: "Cusco", country: "Peru" },
  { iata: "AQP", name: "Rodríguez Ballón International", city: "Arequipa", country: "Peru" },
  { iata: "IQT", name: "Coronel FAP Francisco Secada Vignetta International", city: "Iquitos", country: "Peru" },
  { iata: "TRU", name: "Capitán FAP Carlos Martínez de Pinillos International", city: "Trujillo", country: "Peru" },

  // Bolivia
  { iata: "LPB", name: "El Alto International", city: "La Paz", country: "Bolivia" },
  { iata: "VVI", name: "Viru Viru International", city: "Santa Cruz de la Sierra", country: "Bolivia" },
  { iata: "CBB", name: "Jorge Wilstermann International", city: "Cochabamba", country: "Bolivia" },

  // Chile
  { iata: "SCL", name: "Arturo Merino Benítez International", city: "Santiago", country: "Chile" },
  { iata: "IQQ", name: "Diego Aracena International", city: "Iquique", country: "Chile" },
  { iata: "ANF", name: "Cerro Moreno International", city: "Antofagasta", country: "Chile" },
  { iata: "CCP", name: "Carriel Sur International", city: "Concepción", country: "Chile" },
  { iata: "PMC", name: "El Tepual International", city: "Puerto Montt", country: "Chile" },
  { iata: "PUQ", name: "Carlos Ibáñez del Campo International", city: "Punta Arenas", country: "Chile" },
  { iata: "IPC", name: "Mataveri International", city: "Hanga Roa", country: "Chile", keywords: ["easter island", "isla de pascua"] },

  // Argentina
  { iata: "EZE", name: "Ministro Pistarini International", city: "Buenos Aires", country: "Argentina", keywords: ["ezeiza"] },
  { iata: "AEP", name: "Jorge Newbery Airfield", city: "Buenos Aires", country: "Argentina", keywords: ["aeroparque"] },
  { iata: "COR", name: "Ingeniero Ambrosio Taravella International", city: "Córdoba", country: "Argentina" },
  { iata: "MDZ", name: "El Plumerillo International", city: "Mendoza", country: "Argentina" },
  { iata: "BRC", name: "San Carlos de Bariloche International", city: "Bariloche", country: "Argentina" },
  { iata: "IGR", name: "Cataratas del Iguazú International", city: "Puerto Iguazú", country: "Argentina" },
  { iata: "ROS", name: "Islas Malvinas International", city: "Rosario", country: "Argentina" },
  { iata: "SLA", name: "Martín Miguel de Güemes International", city: "Salta", country: "Argentina" },
  { iata: "TUC", name: "Teniente General Benjamín Matienzo International", city: "San Miguel de Tucumán", country: "Argentina" },
  { iata: "USH", name: "Ushuaia International", city: "Ushuaia", country: "Argentina", keywords: ["tierra del fuego"] },
  { iata: "NQN", name: "Presidente Perón International", city: "Neuquén", country: "Argentina" },
  { iata: "FTE", name: "Comandante Armando Tola International", city: "El Calafate", country: "Argentina" },

  // Uruguay
  { iata: "MVD", name: "Carrasco International", city: "Montevideo", country: "Uruguay" },
  { iata: "PDP", name: "Capitán de Corbeta Carlos A. Curbelo International", city: "Punta del Este", country: "Uruguay" },

  // Paraguay
  { iata: "ASU", name: "Silvio Pettirossi International", city: "Asunción", country: "Paraguay" },
  { iata: "CIO", name: "Guaraní International", city: "Ciudad del Este", country: "Paraguay" },

  // Brazil
  { iata: "GRU", name: "São Paulo-Guarulhos International", city: "São Paulo", country: "Brazil", keywords: ["cumbica"] },
  { iata: "CGH", name: "Congonhas Airport", city: "São Paulo", country: "Brazil" },
  { iata: "GIG", name: "Rio de Janeiro-Galeão International", city: "Rio de Janeiro", country: "Brazil", keywords: ["tom jobim"] },
  { iata: "SDU", name: "Santos Dumont Airport", city: "Rio de Janeiro", country: "Brazil" },
  { iata: "BSB", name: "Presidente Juscelino Kubitschek International", city: "Brasília", country: "Brazil" },
  { iata: "CNF", name: "Tancredo Neves International", city: "Belo Horizonte", country: "Brazil", keywords: ["confins"] },
  { iata: "SSA", name: "Deputado Luís Eduardo Magalhães International", city: "Salvador", country: "Brazil", keywords: ["bahia"] },
  { iata: "REC", name: "Recife/Guararapes International", city: "Recife", country: "Brazil" },
  { iata: "FOR", name: "Pinto Martins International", city: "Fortaleza", country: "Brazil" },
  { iata: "POA", name: "Salgado Filho International", city: "Porto Alegre", country: "Brazil" },
  { iata: "CWB", name: "Afonso Pena International", city: "Curitiba", country: "Brazil" },
  { iata: "FLN", name: "Hercílio Luz International", city: "Florianópolis", country: "Brazil" },
  { iata: "MAO", name: "Eduardo Gomes International", city: "Manaus", country: "Brazil" },
  { iata: "BEL", name: "Val-de-Cans International", city: "Belém", country: "Brazil" },
  { iata: "VCP", name: "Viracopos International", city: "Campinas", country: "Brazil" },
  { iata: "NAT", name: "São Gonçalo do Amarante International", city: "Natal", country: "Brazil" },
  { iata: "IGU", name: "Foz do Iguaçu International", city: "Foz do Iguaçu", country: "Brazil" },

  // ============================================
  // UNITED STATES - Major Hubs
  // ============================================
  { iata: "JFK", name: "John F. Kennedy International", city: "New York", country: "United States", keywords: ["nyc", "queens"] },
  { iata: "LGA", name: "LaGuardia Airport", city: "New York", country: "United States", keywords: ["nyc"] },
  { iata: "EWR", name: "Newark Liberty International", city: "Newark", country: "United States", keywords: ["new york", "new jersey"] },
  { iata: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "United States", keywords: ["california"] },
  { iata: "ORD", name: "O'Hare International", city: "Chicago", country: "United States", keywords: ["illinois"] },
  { iata: "MDW", name: "Midway International", city: "Chicago", country: "United States" },
  { iata: "DFW", name: "Dallas/Fort Worth International", city: "Dallas", country: "United States", keywords: ["texas"] },
  { iata: "DAL", name: "Dallas Love Field", city: "Dallas", country: "United States" },
  { iata: "ATL", name: "Hartsfield-Jackson Atlanta International", city: "Atlanta", country: "United States", keywords: ["georgia"] },
  { iata: "MIA", name: "Miami International", city: "Miami", country: "United States", keywords: ["florida"] },
  { iata: "FLL", name: "Fort Lauderdale-Hollywood International", city: "Fort Lauderdale", country: "United States" },
  { iata: "MCO", name: "Orlando International", city: "Orlando", country: "United States", keywords: ["florida"] },
  { iata: "SFO", name: "San Francisco International", city: "San Francisco", country: "United States", keywords: ["california"] },
  { iata: "OAK", name: "Oakland International", city: "Oakland", country: "United States" },
  { iata: "SJC", name: "San Jose International", city: "San Jose", country: "United States", keywords: ["silicon valley"] },
  { iata: "SEA", name: "Seattle-Tacoma International", city: "Seattle", country: "United States", keywords: ["washington"] },
  { iata: "BOS", name: "Boston Logan International", city: "Boston", country: "United States", keywords: ["massachusetts"] },
  { iata: "DEN", name: "Denver International", city: "Denver", country: "United States", keywords: ["colorado"] },
  { iata: "PHX", name: "Phoenix Sky Harbor International", city: "Phoenix", country: "United States", keywords: ["arizona"] },
  { iata: "LAS", name: "Harry Reid International", city: "Las Vegas", country: "United States", keywords: ["nevada"] },
  { iata: "MSP", name: "Minneapolis-Saint Paul International", city: "Minneapolis", country: "United States", keywords: ["minnesota"] },
  { iata: "DTW", name: "Detroit Metropolitan", city: "Detroit", country: "United States", keywords: ["michigan"] },
  { iata: "PHL", name: "Philadelphia International", city: "Philadelphia", country: "United States", keywords: ["pennsylvania"] },
  { iata: "CLT", name: "Charlotte Douglas International", city: "Charlotte", country: "United States", keywords: ["north carolina"] },
  { iata: "DCA", name: "Ronald Reagan Washington National", city: "Washington DC", country: "United States" },
  { iata: "IAD", name: "Washington Dulles International", city: "Washington DC", country: "United States" },
  { iata: "BWI", name: "Baltimore/Washington International", city: "Baltimore", country: "United States" },
  { iata: "IAH", name: "George Bush Intercontinental", city: "Houston", country: "United States", keywords: ["texas"] },
  { iata: "HOU", name: "William P. Hobby Airport", city: "Houston", country: "United States" },
  { iata: "SAN", name: "San Diego International", city: "San Diego", country: "United States" },
  { iata: "TPA", name: "Tampa International", city: "Tampa", country: "United States" },
  { iata: "PDX", name: "Portland International", city: "Portland", country: "United States", keywords: ["oregon"] },
  { iata: "SLC", name: "Salt Lake City International", city: "Salt Lake City", country: "United States", keywords: ["utah"] },
  { iata: "BNA", name: "Nashville International", city: "Nashville", country: "United States", keywords: ["tennessee"] },
  { iata: "AUS", name: "Austin-Bergstrom International", city: "Austin", country: "United States", keywords: ["texas"] },
  { iata: "STL", name: "St. Louis Lambert International", city: "St. Louis", country: "United States", keywords: ["missouri"] },
  { iata: "RDU", name: "Raleigh-Durham International", city: "Raleigh", country: "United States", keywords: ["north carolina"] },
  { iata: "MCI", name: "Kansas City International", city: "Kansas City", country: "United States", keywords: ["missouri"] },
  { iata: "RSW", name: "Southwest Florida International", city: "Fort Myers", country: "United States" },
  { iata: "IND", name: "Indianapolis International", city: "Indianapolis", country: "United States", keywords: ["indiana"] },
  { iata: "CVG", name: "Cincinnati/Northern Kentucky International", city: "Cincinnati", country: "United States", keywords: ["ohio"] },
  { iata: "PIT", name: "Pittsburgh International", city: "Pittsburgh", country: "United States", keywords: ["pennsylvania"] },
  { iata: "CLE", name: "Cleveland Hopkins International", city: "Cleveland", country: "United States", keywords: ["ohio"] },
  { iata: "CMH", name: "John Glenn Columbus International", city: "Columbus", country: "United States", keywords: ["ohio"] },
  { iata: "SAT", name: "San Antonio International", city: "San Antonio", country: "United States", keywords: ["texas"] },
  { iata: "MKE", name: "General Mitchell International", city: "Milwaukee", country: "United States", keywords: ["wisconsin"] },
  { iata: "ONT", name: "Ontario International", city: "Ontario", country: "United States", keywords: ["los angeles"] },
  { iata: "SMF", name: "Sacramento International", city: "Sacramento", country: "United States", keywords: ["california"] },
  { iata: "JAX", name: "Jacksonville International", city: "Jacksonville", country: "United States" },
  { iata: "BUR", name: "Hollywood Burbank Airport", city: "Burbank", country: "United States", keywords: ["los angeles"] },
  { iata: "SNA", name: "John Wayne Airport", city: "Santa Ana", country: "United States", keywords: ["orange county"] },
  { iata: "ABQ", name: "Albuquerque International Sunport", city: "Albuquerque", country: "United States", keywords: ["new mexico"] },
  { iata: "ANC", name: "Ted Stevens Anchorage International", city: "Anchorage", country: "United States", keywords: ["alaska"] },
  { iata: "HNL", name: "Daniel K. Inouye International", city: "Honolulu", country: "United States", keywords: ["hawaii", "oahu"] },
  { iata: "OGG", name: "Kahului Airport", city: "Kahului", country: "United States", keywords: ["maui", "hawaii"] },
  { iata: "KOA", name: "Ellison Onizuka Kona International", city: "Kailua-Kona", country: "United States", keywords: ["hawaii", "big island"] },
  { iata: "LIH", name: "Lihue Airport", city: "Lihue", country: "United States", keywords: ["kauai", "hawaii"] },
  { iata: "MSY", name: "Louis Armstrong New Orleans International", city: "New Orleans", country: "United States", keywords: ["louisiana"] },
  { iata: "PBI", name: "Palm Beach International", city: "West Palm Beach", country: "United States" },
  { iata: "OMA", name: "Eppley Airfield", city: "Omaha", country: "United States", keywords: ["nebraska"] },
  { iata: "BUF", name: "Buffalo Niagara International", city: "Buffalo", country: "United States", keywords: ["new york"] },
  { iata: "SYR", name: "Syracuse Hancock International", city: "Syracuse", country: "United States" },
  { iata: "ALB", name: "Albany International", city: "Albany", country: "United States", keywords: ["new york"] },
  { iata: "TUS", name: "Tucson International", city: "Tucson", country: "United States", keywords: ["arizona"] },
  { iata: "ELP", name: "El Paso International", city: "El Paso", country: "United States", keywords: ["texas"] },
  { iata: "MEM", name: "Memphis International", city: "Memphis", country: "United States", keywords: ["tennessee"] },

  // ============================================
  // CANADA
  // ============================================
  { iata: "YYZ", name: "Toronto Pearson International", city: "Toronto", country: "Canada", keywords: ["ontario"] },
  { iata: "YYC", name: "Calgary International", city: "Calgary", country: "Canada", keywords: ["alberta"] },
  { iata: "YVR", name: "Vancouver International", city: "Vancouver", country: "Canada", keywords: ["british columbia"] },
  { iata: "YUL", name: "Montréal-Pierre Elliott Trudeau International", city: "Montreal", country: "Canada", keywords: ["quebec"] },
  { iata: "YEG", name: "Edmonton International", city: "Edmonton", country: "Canada", keywords: ["alberta"] },
  { iata: "YOW", name: "Ottawa Macdonald-Cartier International", city: "Ottawa", country: "Canada", keywords: ["ontario"] },
  { iata: "YWG", name: "Winnipeg James Armstrong Richardson International", city: "Winnipeg", country: "Canada", keywords: ["manitoba"] },
  { iata: "YHZ", name: "Halifax Stanfield International", city: "Halifax", country: "Canada", keywords: ["nova scotia"] },
  { iata: "YQB", name: "Québec City Jean Lesage International", city: "Quebec City", country: "Canada" },
  { iata: "YYJ", name: "Victoria International", city: "Victoria", country: "Canada", keywords: ["british columbia"] },
  { iata: "YXE", name: "Saskatoon John G. Diefenbaker International", city: "Saskatoon", country: "Canada", keywords: ["saskatchewan"] },
  { iata: "YQR", name: "Regina International", city: "Regina", country: "Canada", keywords: ["saskatchewan"] },
  { iata: "YYT", name: "St. John's International", city: "St. John's", country: "Canada", keywords: ["newfoundland"] },
  { iata: "YKF", name: "Region of Waterloo International", city: "Kitchener", country: "Canada", keywords: ["ontario"] },
  { iata: "YLW", name: "Kelowna International", city: "Kelowna", country: "Canada", keywords: ["british columbia"] },

  // ============================================
  // EUROPE - Major Hubs
  // ============================================
  // United Kingdom
  { iata: "LHR", name: "Heathrow Airport", city: "London", country: "United Kingdom", keywords: ["uk", "england"] },
  { iata: "LGW", name: "Gatwick Airport", city: "London", country: "United Kingdom" },
  { iata: "STN", name: "Stansted Airport", city: "London", country: "United Kingdom" },
  { iata: "LTN", name: "Luton Airport", city: "London", country: "United Kingdom" },
  { iata: "LCY", name: "London City Airport", city: "London", country: "United Kingdom" },
  { iata: "MAN", name: "Manchester Airport", city: "Manchester", country: "United Kingdom" },
  { iata: "EDI", name: "Edinburgh Airport", city: "Edinburgh", country: "United Kingdom", keywords: ["scotland"] },
  { iata: "BHX", name: "Birmingham Airport", city: "Birmingham", country: "United Kingdom" },
  { iata: "GLA", name: "Glasgow Airport", city: "Glasgow", country: "United Kingdom", keywords: ["scotland"] },
  { iata: "BRS", name: "Bristol Airport", city: "Bristol", country: "United Kingdom" },

  // France
  { iata: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", keywords: ["roissy"] },
  { iata: "ORY", name: "Orly Airport", city: "Paris", country: "France" },
  { iata: "NCE", name: "Nice Côte d'Azur Airport", city: "Nice", country: "France" },
  { iata: "LYS", name: "Lyon-Saint Exupéry Airport", city: "Lyon", country: "France" },
  { iata: "MRS", name: "Marseille Provence Airport", city: "Marseille", country: "France" },
  { iata: "TLS", name: "Toulouse-Blagnac Airport", city: "Toulouse", country: "France" },
  { iata: "BOD", name: "Bordeaux-Mérignac Airport", city: "Bordeaux", country: "France" },

  // Germany
  { iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany" },
  { iata: "MUC", name: "Munich Airport", city: "Munich", country: "Germany", keywords: ["munchen"] },
  { iata: "BER", name: "Berlin Brandenburg Airport", city: "Berlin", country: "Germany" },
  { iata: "DUS", name: "Düsseldorf Airport", city: "Düsseldorf", country: "Germany" },
  { iata: "HAM", name: "Hamburg Airport", city: "Hamburg", country: "Germany" },
  { iata: "STR", name: "Stuttgart Airport", city: "Stuttgart", country: "Germany" },
  { iata: "CGN", name: "Cologne Bonn Airport", city: "Cologne", country: "Germany", keywords: ["koln"] },

  // Spain
  { iata: "MAD", name: "Adolfo Suárez Madrid-Barajas Airport", city: "Madrid", country: "Spain" },
  { iata: "BCN", name: "Barcelona-El Prat Airport", city: "Barcelona", country: "Spain" },
  { iata: "PMI", name: "Palma de Mallorca Airport", city: "Palma de Mallorca", country: "Spain", keywords: ["mallorca"] },
  { iata: "AGP", name: "Málaga Airport", city: "Málaga", country: "Spain" },
  { iata: "ALC", name: "Alicante-Elche Airport", city: "Alicante", country: "Spain" },
  { iata: "VLC", name: "Valencia Airport", city: "Valencia", country: "Spain" },
  { iata: "SVQ", name: "Seville Airport", city: "Seville", country: "Spain", keywords: ["sevilla"] },
  { iata: "IBZ", name: "Ibiza Airport", city: "Ibiza", country: "Spain" },
  { iata: "TFS", name: "Tenerife South Airport", city: "Tenerife", country: "Spain", keywords: ["canary islands"] },
  { iata: "LPA", name: "Gran Canaria Airport", city: "Las Palmas", country: "Spain", keywords: ["canary islands"] },
  { iata: "BIO", name: "Bilbao Airport", city: "Bilbao", country: "Spain", keywords: ["basque"] },

  // Italy
  { iata: "FCO", name: "Leonardo da Vinci-Fiumicino Airport", city: "Rome", country: "Italy", keywords: ["roma"] },
  { iata: "MXP", name: "Milan Malpensa Airport", city: "Milan", country: "Italy", keywords: ["milano"] },
  { iata: "LIN", name: "Milan Linate Airport", city: "Milan", country: "Italy" },
  { iata: "VCE", name: "Venice Marco Polo Airport", city: "Venice", country: "Italy", keywords: ["venezia"] },
  { iata: "NAP", name: "Naples International Airport", city: "Naples", country: "Italy", keywords: ["napoli"] },
  { iata: "BLQ", name: "Bologna Guglielmo Marconi Airport", city: "Bologna", country: "Italy" },
  { iata: "FLR", name: "Florence Airport", city: "Florence", country: "Italy", keywords: ["firenze"] },
  { iata: "PSA", name: "Pisa International Airport", city: "Pisa", country: "Italy" },
  { iata: "CTA", name: "Catania-Fontanarossa Airport", city: "Catania", country: "Italy", keywords: ["sicily"] },
  { iata: "PMO", name: "Falcone Borsellino Airport", city: "Palermo", country: "Italy", keywords: ["sicily"] },

  // Netherlands, Belgium, Switzerland
  { iata: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Netherlands" },
  { iata: "BRU", name: "Brussels Airport", city: "Brussels", country: "Belgium", keywords: ["bruxelles"] },
  { iata: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Switzerland" },
  { iata: "GVA", name: "Geneva Airport", city: "Geneva", country: "Switzerland", keywords: ["geneve"] },
  { iata: "BSL", name: "EuroAirport Basel-Mulhouse-Freiburg", city: "Basel", country: "Switzerland" },

  // Portugal
  { iata: "LIS", name: "Lisbon Airport", city: "Lisbon", country: "Portugal", keywords: ["lisboa"] },
  { iata: "OPO", name: "Francisco Sá Carneiro Airport", city: "Porto", country: "Portugal" },
  { iata: "FAO", name: "Faro Airport", city: "Faro", country: "Portugal", keywords: ["algarve"] },
  { iata: "FNC", name: "Cristiano Ronaldo International Airport", city: "Funchal", country: "Portugal", keywords: ["madeira"] },
  { iata: "PDL", name: "João Paulo II Airport", city: "Ponta Delgada", country: "Portugal", keywords: ["azores"] },

  // Nordic Countries
  { iata: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark", keywords: ["kobenhavn"] },
  { iata: "OSL", name: "Oslo Gardermoen Airport", city: "Oslo", country: "Norway" },
  { iata: "ARN", name: "Stockholm Arlanda Airport", city: "Stockholm", country: "Sweden" },
  { iata: "HEL", name: "Helsinki-Vantaa Airport", city: "Helsinki", country: "Finland" },
  { iata: "KEF", name: "Keflavík International Airport", city: "Reykjavik", country: "Iceland" },
  { iata: "BGO", name: "Bergen Airport Flesland", city: "Bergen", country: "Norway" },
  { iata: "GOT", name: "Göteborg Landvetter Airport", city: "Gothenburg", country: "Sweden" },

  // Austria, Czech Republic, Poland
  { iata: "VIE", name: "Vienna International Airport", city: "Vienna", country: "Austria", keywords: ["wien"] },
  { iata: "PRG", name: "Václav Havel Airport Prague", city: "Prague", country: "Czech Republic", keywords: ["praha"] },
  { iata: "WAW", name: "Warsaw Chopin Airport", city: "Warsaw", country: "Poland", keywords: ["warszawa"] },
  { iata: "KRK", name: "Kraków John Paul II International Airport", city: "Kraków", country: "Poland" },

  // Greece, Turkey
  { iata: "ATH", name: "Athens International Airport", city: "Athens", country: "Greece" },
  { iata: "SKG", name: "Thessaloniki Airport", city: "Thessaloniki", country: "Greece" },
  { iata: "HER", name: "Heraklion International Airport", city: "Heraklion", country: "Greece", keywords: ["crete"] },
  { iata: "RHO", name: "Rhodes International Airport", city: "Rhodes", country: "Greece" },
  { iata: "JTR", name: "Santorini Airport", city: "Santorini", country: "Greece", keywords: ["thira"] },
  { iata: "MJT", name: "Mytilene International Airport", city: "Lesbos", country: "Greece" },
  { iata: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey" },
  { iata: "SAW", name: "Sabiha Gökçen International Airport", city: "Istanbul", country: "Turkey" },
  { iata: "AYT", name: "Antalya Airport", city: "Antalya", country: "Turkey" },
  { iata: "ADB", name: "Adnan Menderes Airport", city: "Izmir", country: "Turkey" },

  // Ireland
  { iata: "DUB", name: "Dublin Airport", city: "Dublin", country: "Ireland" },
  { iata: "SNN", name: "Shannon Airport", city: "Shannon", country: "Ireland" },
  { iata: "ORK", name: "Cork Airport", city: "Cork", country: "Ireland" },

  // ============================================
  // ASIA - Major Hubs
  // ============================================
  { iata: "NRT", name: "Narita International Airport", city: "Tokyo", country: "Japan" },
  { iata: "HND", name: "Haneda Airport", city: "Tokyo", country: "Japan" },
  { iata: "KIX", name: "Kansai International Airport", city: "Osaka", country: "Japan" },
  { iata: "ICN", name: "Incheon International Airport", city: "Seoul", country: "South Korea" },
  { iata: "GMP", name: "Gimpo International Airport", city: "Seoul", country: "South Korea" },
  { iata: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "Hong Kong" },
  { iata: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore" },
  { iata: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand" },
  { iata: "DMK", name: "Don Mueang International Airport", city: "Bangkok", country: "Thailand" },
  { iata: "KUL", name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: "Malaysia" },
  { iata: "CGK", name: "Soekarno-Hatta International Airport", city: "Jakarta", country: "Indonesia" },
  { iata: "DPS", name: "Ngurah Rai International Airport", city: "Bali", country: "Indonesia", keywords: ["denpasar"] },
  { iata: "MNL", name: "Ninoy Aquino International Airport", city: "Manila", country: "Philippines" },
  { iata: "CEB", name: "Mactan-Cebu International Airport", city: "Cebu", country: "Philippines" },
  { iata: "HAN", name: "Noi Bai International Airport", city: "Hanoi", country: "Vietnam" },
  { iata: "SGN", name: "Tan Son Nhat International Airport", city: "Ho Chi Minh City", country: "Vietnam", keywords: ["saigon"] },
  { iata: "PEK", name: "Beijing Capital International Airport", city: "Beijing", country: "China" },
  { iata: "PKX", name: "Beijing Daxing International Airport", city: "Beijing", country: "China" },
  { iata: "PVG", name: "Shanghai Pudong International Airport", city: "Shanghai", country: "China" },
  { iata: "SHA", name: "Shanghai Hongqiao International Airport", city: "Shanghai", country: "China" },
  { iata: "CAN", name: "Guangzhou Baiyun International Airport", city: "Guangzhou", country: "China" },
  { iata: "SZX", name: "Shenzhen Bao'an International Airport", city: "Shenzhen", country: "China" },
  { iata: "DEL", name: "Indira Gandhi International Airport", city: "New Delhi", country: "India", keywords: ["delhi"] },
  { iata: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", country: "India" },
  { iata: "BLR", name: "Kempegowda International Airport", city: "Bangalore", country: "India" },
  { iata: "MAA", name: "Chennai International Airport", city: "Chennai", country: "India" },
  { iata: "CCU", name: "Netaji Subhas Chandra Bose International Airport", city: "Kolkata", country: "India" },
  { iata: "CMB", name: "Bandaranaike International Airport", city: "Colombo", country: "Sri Lanka" },
  { iata: "MLE", name: "Velana International Airport", city: "Malé", country: "Maldives" },
  { iata: "KTM", name: "Tribhuvan International Airport", city: "Kathmandu", country: "Nepal" },

  // ============================================
  // MIDDLE EAST
  // ============================================
  { iata: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates" },
  { iata: "AUH", name: "Abu Dhabi International Airport", city: "Abu Dhabi", country: "United Arab Emirates" },
  { iata: "DOH", name: "Hamad International Airport", city: "Doha", country: "Qatar" },
  { iata: "TLV", name: "Ben Gurion Airport", city: "Tel Aviv", country: "Israel" },
  { iata: "AMM", name: "Queen Alia International Airport", city: "Amman", country: "Jordan" },
  { iata: "CAI", name: "Cairo International Airport", city: "Cairo", country: "Egypt" },
  { iata: "JED", name: "King Abdulaziz International Airport", city: "Jeddah", country: "Saudi Arabia" },
  { iata: "RUH", name: "King Khalid International Airport", city: "Riyadh", country: "Saudi Arabia" },
  { iata: "BAH", name: "Bahrain International Airport", city: "Manama", country: "Bahrain" },
  { iata: "MCT", name: "Muscat International Airport", city: "Muscat", country: "Oman" },
  { iata: "KWI", name: "Kuwait International Airport", city: "Kuwait City", country: "Kuwait" },

  // ============================================
  // AFRICA - Major Hubs
  // ============================================
  { iata: "JNB", name: "O.R. Tambo International Airport", city: "Johannesburg", country: "South Africa" },
  { iata: "CPT", name: "Cape Town International Airport", city: "Cape Town", country: "South Africa" },
  { iata: "DUR", name: "King Shaka International Airport", city: "Durban", country: "South Africa" },
  { iata: "NBO", name: "Jomo Kenyatta International Airport", city: "Nairobi", country: "Kenya" },
  { iata: "ADD", name: "Bole International Airport", city: "Addis Ababa", country: "Ethiopia" },
  { iata: "LOS", name: "Murtala Muhammed International Airport", city: "Lagos", country: "Nigeria" },
  { iata: "ACC", name: "Kotoka International Airport", city: "Accra", country: "Ghana" },
  { iata: "CMN", name: "Mohammed V International Airport", city: "Casablanca", country: "Morocco" },
  { iata: "RAK", name: "Marrakech Menara Airport", city: "Marrakech", country: "Morocco" },
  { iata: "ALG", name: "Houari Boumediene Airport", city: "Algiers", country: "Algeria" },
  { iata: "TUN", name: "Tunis-Carthage International Airport", city: "Tunis", country: "Tunisia" },
  { iata: "DSS", name: "Blaise Diagne International Airport", city: "Dakar", country: "Senegal" },
  { iata: "DAR", name: "Julius Nyerere International Airport", city: "Dar es Salaam", country: "Tanzania" },
  { iata: "EBB", name: "Entebbe International Airport", city: "Entebbe", country: "Uganda", keywords: ["kampala"] },
  { iata: "KGL", name: "Kigali International Airport", city: "Kigali", country: "Rwanda" },
  { iata: "MRU", name: "Sir Seewoosagur Ramgoolam International Airport", city: "Mauritius", country: "Mauritius" },

  // ============================================
  // OCEANIA
  // ============================================
  { iata: "SYD", name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia" },
  { iata: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia" },
  { iata: "BNE", name: "Brisbane Airport", city: "Brisbane", country: "Australia" },
  { iata: "PER", name: "Perth Airport", city: "Perth", country: "Australia" },
  { iata: "AKL", name: "Auckland Airport", city: "Auckland", country: "New Zealand" },
  { iata: "WLG", name: "Wellington International Airport", city: "Wellington", country: "New Zealand" },
  { iata: "CHC", name: "Christchurch International Airport", city: "Christchurch", country: "New Zealand" },
  { iata: "ZQN", name: "Queenstown Airport", city: "Queenstown", country: "New Zealand" },
  { iata: "NAN", name: "Nadi International Airport", city: "Nadi", country: "Fiji" },
  { iata: "PPT", name: "Faa'a International Airport", city: "Papeete", country: "French Polynesia", keywords: ["tahiti"] },
]

/**
 * Search airports by query string
 * Searches IATA code, city, country, name, and keywords
 */
export function searchAirports(query: string, limit = 10): Airport[] {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []

  // Score-based matching for better results
  const scored = AIRPORTS.map(airport => {
    let score = 0

    // Exact IATA match = highest priority
    if (airport.iata.toLowerCase() === q) {
      score = 100
    }
    // IATA starts with query
    else if (airport.iata.toLowerCase().startsWith(q)) {
      score = 90
    }
    // City starts with query
    else if (airport.city.toLowerCase().startsWith(q)) {
      score = 80
    }
    // City contains query
    else if (airport.city.toLowerCase().includes(q)) {
      score = 70
    }
    // Country starts with query
    else if (airport.country.toLowerCase().startsWith(q)) {
      score = 60
    }
    // Country contains query
    else if (airport.country.toLowerCase().includes(q)) {
      score = 50
    }
    // Name contains query
    else if (airport.name.toLowerCase().includes(q)) {
      score = 40
    }
    // Keyword match
    else if (airport.keywords?.some(k => k.toLowerCase().includes(q))) {
      score = 30
    }

    return { airport, score }
  })

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.airport)
}

/**
 * Find airport by city name (fuzzy match)
 * Used for pre-filling based on trip origin/destination
 */
export function findAirportByCity(city: string): Airport | undefined {
  if (!city) return undefined

  const normalized = city.toLowerCase().trim()

  // First try exact city match
  let match = AIRPORTS.find(a => a.city.toLowerCase() === normalized)
  if (match) return match

  // Try city contains or is contained
  match = AIRPORTS.find(a =>
    a.city.toLowerCase().includes(normalized) ||
    normalized.includes(a.city.toLowerCase())
  )
  if (match) return match

  // Try country match (e.g., "Puerto Rico" → SJU)
  match = AIRPORTS.find(a =>
    a.country.toLowerCase().includes(normalized) ||
    normalized.includes(a.country.toLowerCase())
  )
  if (match) return match

  // Try keywords
  match = AIRPORTS.find(a =>
    a.keywords?.some(k =>
      k.toLowerCase().includes(normalized) ||
      normalized.includes(k.toLowerCase())
    )
  )

  return match
}

/**
 * Find airport by IATA code
 */
export function findAirportByIATA(iata: string): Airport | undefined {
  if (!iata || iata.length !== 3) return undefined
  return AIRPORTS.find(a => a.iata.toLowerCase() === iata.toLowerCase())
}

/**
 * Format airport for display
 * e.g., "SJU - San Juan, Puerto Rico"
 */
export function formatAirport(airport: Airport): string {
  return `${airport.iata} - ${airport.city}, ${airport.country}`
}

/**
 * Format airport for short display
 * e.g., "SJU (San Juan)"
 */
export function formatAirportShort(airport: Airport): string {
  return `${airport.iata} (${airport.city})`
}
