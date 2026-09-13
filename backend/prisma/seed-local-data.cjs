const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const LOCAL_PASSWORD = 'Test@123456';

const wards = [
  'Phường Bình Thuận',
  'Phường Hòa Cường Bắc',
  'Phường Hòa Cường Nam',
  'Phường Hòa Thuận Đông',
  'Phường Hòa Thuận Tây',
  'Phường Thanh Bình',
  'Phường Thuận Phước',
  'Phường An Khê',
  'Phường Chính Gián',
  'Phường Hòa Khê',
  'Phường Tân Chính',
  'Phường Thanh Khê Đông',
  'Phường Thanh Khê Tây',
  'Phường An Hải Bắc',
  'Phường Mân Thái',
  'Phường Nại Hiên Đông',
  'Phường Phước Mỹ',
  'Phường Thọ Quang',
  'Phường Hòa Minh',
  'Phường Hòa Hiệp Bắc',
  'Phường Hòa Khánh Bắc',
  'Phường Hòa Khánh Nam'
];

const universities = [
  {
    id: 'DUT',
    name: 'Trường Đại học Bách khoa',
    wardName: 'Phường Hòa Khánh Bắc',
    streetName: 'Nguyễn Lương Bằng',
    houseNumber: '54',
    latitude: 16.074893,
    longitude: 108.153204
  },
  {
    id: 'DUE',
    name: 'Trường Đại học Kinh tế',
    wardName: 'Phường Phước Mỹ',
    streetName: 'Ngũ Hành Sơn',
    houseNumber: '71',
    latitude: 16.043679,
    longitude: 108.241880
  },
  {
    id: 'UFL',
    name: 'Trường Đại học Ngoại ngữ',
    wardName: 'Phường Hòa Khánh Bắc',
    streetName: 'Lương Nhữ Hộc',
    houseNumber: '131',
    latitude: 16.030999,
    longitude: 108.214426
  },
  {
    id: 'UED',
    name: 'Trường Đại học Sư phạm',
    wardName: 'Phường Hòa Khánh Bắc',
    streetName: 'Tôn Đức Thắng',
    houseNumber: '459',
    latitude: 16.060425,
    longitude: 108.157417
  },
  {
    id: 'UTE',
    name: 'Trường Đại học Sư phạm Kỹ thuật',
    wardName: 'Phường Thanh Bình',
    streetName: 'Nguyễn Lương Bằng',
    houseNumber: '48',
    latitude: 16.073994,
    longitude: 108.215239
  },
  {
    id: 'VKU',
    name: 'Trường Đại học Công nghệ thông tin và Truyền thông Việt - Hàn',
    wardName: 'Phường Hòa Cường Nam',
    streetName: 'Nam Kỳ Khởi Nghĩa',
    houseNumber: '470',
    latitude: 15.975313,
    longitude: 108.253188
  },
  {
    id: 'VNUK',
    name: 'Viện Nghiên cứu và Đào tạo Việt - Anh',
    wardName: 'Phường Bình Thuận',
    streetName: 'Lê Lợi',
    houseNumber: '158A',
    latitude: 16.070822,
    longitude: 108.219816
  },
  {
    id: 'SMP',
    name: 'Trường Y Dược, Đại học Đà Nẵng',
    wardName: 'Phường Hòa Khánh Bắc',
    streetName: 'Nam Kỳ Khởi Nghĩa',
    houseNumber: '99',
    latitude: 15.982900,
    longitude: 108.253400
  },
  {
    id: 'YDN',
    name: 'Trường Đại học Kỹ thuật Y Dược Đà Nẵng',
    wardName: 'Phường Hòa Thuận Tây',
    streetName: 'Hải Phòng',
    houseNumber: '99',
    latitude: 16.068541,
    longitude: 108.219512
  },
  {
    id: 'DSU',
    name: 'Trường Đại học Thể dục Thể thao Đà Nẵng',
    wardName: 'Phường Hòa Khánh Bắc',
    streetName: 'Nguyễn Lương Bằng',
    houseNumber: '44',
    latitude: 16.067607,
    longitude: 108.198785
  },
  {
    id: 'DAU',
    name: 'Trường Đại học Kiến trúc Đà Nẵng',
    wardName: 'Phường Hòa Cường Nam',
    streetName: 'Đô Đốc Lân',
    houseNumber: '566',
    latitude: 16.033512,
    longitude: 108.218736
  },
  {
    id: 'UDA',
    name: 'Trường Đại học Đông Á',
    wardName: 'Phường Hòa Cường Bắc',
    streetName: 'Xô Viết Nghệ Tĩnh',
    houseNumber: '33',
    latitude: 16.033940,
    longitude: 108.222900
  },
  {
    id: 'PCTU',
    name: 'Trường Đại học Phan Châu Trinh',
    wardName: 'Phường Hòa Khánh Bắc',
    streetName: 'Nguyễn Lương Bằng',
    houseNumber: '09',
    latitude: 15.939900,
    longitude: 108.250900
  },
  {
    id: 'FPT',
    name: 'Trường Đại học FPT tại Đà Nẵng',
    wardName: 'Phường Hòa Cường Nam',
    streetName: 'Nam Kỳ Khởi Nghĩa',
    houseNumber: 'Khu đô thị FPT City',
    latitude: 15.982300,
    longitude: 108.254200
  },
  {
    id: 'GWU',
    name: 'Đại học Greenwich',
    wardName: 'Phường Hòa Cường Bắc',
    streetName: 'Nguyễn Hữu Thọ',
    houseNumber: '658',
    latitude: 16.072485,
    longitude: 108.235192
  },
  {
    id: 'DTU',
    name: 'Đại học Duy Tân',
    wardName: 'Phường Thanh Khê Tây',
    streetName: 'Nguyễn Văn Linh',
    houseNumber: '254',
    latitude: 16.060192,
    longitude: 108.214343
  }
];

const universityIds = universities.map((university) => university.id);

const amenities = [
  { name: 'WiFi tốc độ cao', aliases: ['Wifi', 'WiFi', 'wifi'] },
  { name: 'Máy giặt', aliases: ['May giat'] },
  { name: 'Chỗ để xe', aliases: ['Cho de xe'] },
  { name: 'Ban công', aliases: ['Ban cong', 'Ban công rộng'] },
  { name: 'Cửa sổ', aliases: ['Cua so'] },
  { name: 'Gác lửng', aliases: ['Gac xep', 'Gác xép'] },
  { name: 'Điều hòa', aliases: ['Dieu hoa', 'Máy lạnh'] },
  { name: 'Tủ lạnh', aliases: ['Tu lanh'] },
  { name: 'Nóng lạnh', aliases: ['Nong lanh'] },
  { name: 'Bếp riêng', aliases: ['Bep rieng'] },
  { name: 'Thang máy', aliases: ['Thang may'] },
  { name: 'Camera an ninh', aliases: ['Camera'] }
];

const imageUrls = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
];

const LOAD_USER_COUNT = 500;
const LOAD_POST_COUNT = 1000;
const LOAD_COMMENT_COUNT = 320;
const LOAD_REPORT_COUNT = 500;
const LOAD_FAVORITE_COUNT = 450;
const LOAD_REQUEST_COUNT = 350;
const LOAD_SEED = 20260609;

let cachedLocalPasswordHash;

const createSeededRandom = (seed) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const random = createSeededRandom(LOAD_SEED);

const getLocalPasswordHash = async () => {
  if (!cachedLocalPasswordHash) {
    cachedLocalPasswordHash = await bcrypt.hash(LOCAL_PASSWORD, 10);
  }

  return cachedLocalPasswordHash;
};

const sample = (items, rng = random) => items[Math.floor(rng() * items.length)];
const randomInt = (min, max, rng = random) => Math.floor(rng() * (max - min + 1)) + min;
const roundTo = (value, step) => Math.round(value / step) * step;

const metersPerDegreeLatitude = 111320;
const metersPerDegreeLongitude = (latitude) => 111320 * Math.cos((latitude * Math.PI) / 180);

const offsetCoordinate = (latitude, longitude, northMeters, eastMeters) => ({
  latitude: Number((latitude + northMeters / metersPerDegreeLatitude).toFixed(6)),
  longitude: Number((longitude + eastMeters / metersPerDegreeLongitude(latitude)).toFixed(6))
});

const distanceMeters = (a, b) => {
  const midLatitude = ((a.latitude + b.latitude) / 2) * (Math.PI / 180);
  const dx = (b.longitude - a.longitude) * 111320 * Math.cos(midLatitude);
  const dy = (b.latitude - a.latitude) * 111320;
  return Math.sqrt(dx * dx + dy * dy);
};

const distanceToSegmentMeters = (point, start, end) => {
  const midLatitude = ((point.latitude + start.latitude + end.latitude) / 3) * (Math.PI / 180);
  const toXY = (coordinate) => ({
    x: coordinate.longitude * 111320 * Math.cos(midLatitude),
    y: coordinate.latitude * 111320
  });
  const p = toXY(point);
  const a = toXY(start);
  const b = toXY(end);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));
  const projection = {
    x: a.x + t * dx,
    y: a.y + t * dy
  };

  return Math.sqrt((p.x - projection.x) ** 2 + (p.y - projection.y) ** 2);
};

const waterExclusionLines = [
  {
    name: 'Sông Hàn',
    minDistanceMeters: 520,
    points: [
      { latitude: 16.104, longitude: 108.2299 },
      { latitude: 16.091, longitude: 108.2274 },
      { latitude: 16.079, longitude: 108.2248 },
      { latitude: 16.066, longitude: 108.2237 },
      { latitude: 16.052, longitude: 108.2234 },
      { latitude: 16.037, longitude: 108.2241 },
      { latitude: 16.025, longitude: 108.2244 }
    ]
  },
  {
    name: 'Sông Cẩm Lệ',
    minDistanceMeters: 420,
    points: [
      { latitude: 16.024, longitude: 108.179 },
      { latitude: 16.017, longitude: 108.198 },
      { latitude: 16.008, longitude: 108.218 },
      { latitude: 15.998, longitude: 108.237 },
      { latitude: 15.989, longitude: 108.252 }
    ]
  },
  {
    name: 'Sông Cu Đê',
    minDistanceMeters: 360,
    points: [
      { latitude: 16.102, longitude: 108.118 },
      { latitude: 16.101, longitude: 108.139 },
      { latitude: 16.098, longitude: 108.16 },
      { latitude: 16.095, longitude: 108.178 }
    ]
  }
];

const isWaterCoordinate = ({ latitude, longitude }) => {
  const point = { latitude: Number(latitude), longitude: Number(longitude) };

  return waterExclusionLines.some((line) =>
    line.points.slice(0, -1).some((start, index) => {
      const end = line.points[index + 1];
      return distanceToSegmentMeters(point, start, end) < line.minDistanceMeters;
    })
  );
};

const safeListingLocations = [
  {
    label: 'khu Bách khoa',
    wardName: 'Phường Hòa Khánh Bắc',
    district: 'Quận Liên Chiểu',
    nearbyUniversityId: 'DUT',
    latitude: 16.073982,
    longitude: 108.149487,
    jitterMeters: 650,
    streets: ['Nguyễn Lương Bằng', 'Tôn Đức Thắng', 'Âu Cơ']
  },
  {
    label: 'khu Sư phạm',
    wardName: 'Phường Hòa Khánh Bắc',
    district: 'Quận Liên Chiểu',
    nearbyUniversityId: 'UED',
    latitude: 16.060425,
    longitude: 108.157417,
    jitterMeters: 700,
    streets: ['Tôn Đức Thắng', 'Nguyễn Lương Bằng', 'Mẹ Suốt']
  },
  {
    label: 'khu Hòa Minh',
    wardName: 'Phường Hòa Minh',
    district: 'Quận Liên Chiểu',
    nearbyUniversityId: 'DUT',
    latitude: 16.07103,
    longitude: 108.17203,
    jitterMeters: 700,
    streets: ['Tôn Đức Thắng', 'Nguyễn Sinh Sắc', 'Kinh Dương Vương']
  },
  {
    label: 'khu Kinh tế',
    wardName: 'Phường Phước Mỹ',
    district: 'Quận Sơn Trà',
    nearbyUniversityId: 'DUE',
    latitude: 16.043679,
    longitude: 108.24188,
    jitterMeters: 650,
    streets: ['Ngũ Hành Sơn', 'Châu Thị Vĩnh Tế', 'An Thượng']
  },
  {
    label: 'khu Ngoại ngữ',
    wardName: 'Phường Hòa Khánh Bắc',
    district: 'Quận Liên Chiểu',
    nearbyUniversityId: 'UFL',
    latitude: 16.030999,
    longitude: 108.214426,
    jitterMeters: 520,
    streets: ['Lương Nhữ Hộc', 'Cách Mạng Tháng Tám', 'Núi Thành']
  },
  {
    label: 'khu Việt Hàn',
    wardName: 'Phường Hòa Cường Nam',
    district: 'Quận Hải Châu',
    nearbyUniversityId: 'VKU',
    latitude: 15.975313,
    longitude: 108.253188,
    jitterMeters: 520,
    streets: ['Nam Kỳ Khởi Nghĩa', 'Trần Đại Nghĩa', 'Võ Chí Công']
  },
  {
    label: 'khu FPT City',
    wardName: 'Phường Hòa Cường Nam',
    district: 'Quận Hải Châu',
    nearbyUniversityId: 'FPT',
    latitude: 15.9823,
    longitude: 108.2542,
    jitterMeters: 520,
    streets: ['Nam Kỳ Khởi Nghĩa', 'Đô Đốc Lân', 'Võ Chí Công']
  },
  {
    label: 'khu Hải Châu Tây',
    wardName: 'Phường Thanh Bình',
    district: 'Quận Hải Châu',
    nearbyUniversityId: 'UTE',
    latitude: 16.073994,
    longitude: 108.215239,
    jitterMeters: 430,
    streets: ['Nguyễn Tất Thành', 'Ông Ích Khiêm', 'Hải Phòng']
  },
  {
    label: 'khu VNUK',
    wardName: 'Phường Bình Thuận',
    district: 'Quận Hải Châu',
    nearbyUniversityId: 'VNUK',
    latitude: 16.0702,
    longitude: 108.2168,
    jitterMeters: 360,
    streets: ['Lê Lợi', 'Trần Phú', 'Lý Tự Trọng']
  },
  {
    label: 'khu Y Dược',
    wardName: 'Phường Hòa Thuận Tây',
    district: 'Quận Hải Châu',
    nearbyUniversityId: 'YDN',
    latitude: 16.0673,
    longitude: 108.2164,
    jitterMeters: 360,
    streets: ['Hải Phòng', 'Nguyễn Chí Thanh', 'Ông Ích Khiêm']
  },
  {
    label: 'khu Kiến trúc',
    wardName: 'Phường Hòa Cường Nam',
    district: 'Quận Hải Châu',
    nearbyUniversityId: 'DAU',
    latitude: 16.033512,
    longitude: 108.218736,
    jitterMeters: 480,
    streets: ['Đô Đốc Lân', 'Cách Mạng Tháng Tám', 'Núi Thành']
  },
  {
    label: 'khu Đông Á',
    wardName: 'Phường Hòa Cường Bắc',
    district: 'Quận Hải Châu',
    nearbyUniversityId: 'UDA',
    latitude: 16.0342,
    longitude: 108.2168,
    jitterMeters: 420,
    streets: ['Xô Viết Nghệ Tĩnh', 'Núi Thành', 'Duy Tân']
  },
  {
    label: 'khu Duy Tân',
    wardName: 'Phường Thanh Khê Tây',
    district: 'Quận Thanh Khê',
    nearbyUniversityId: 'DTU',
    latitude: 16.060192,
    longitude: 108.214343,
    jitterMeters: 520,
    streets: ['Nguyễn Văn Linh', 'Hàm Nghi', 'Nguyễn Tri Phương']
  },
  {
    label: 'khu Greenwich',
    wardName: 'Phường Hòa Cường Bắc',
    district: 'Quận Hải Châu',
    nearbyUniversityId: 'GWU',
    latitude: 16.04757,
    longitude: 108.22091,
    jitterMeters: 420,
    streets: ['Nguyễn Hữu Thọ', 'Duy Tân', 'Tiểu La']
  },
  {
    label: 'khu Sơn Trà',
    wardName: 'Phường Mân Thái',
    district: 'Quận Sơn Trà',
    nearbyUniversityId: 'DUE',
    latitude: 16.08945,
    longitude: 108.24392,
    jitterMeters: 650,
    streets: ['Hoàng Sa', 'Lê Đức Thọ', 'Nguyễn Văn Thoại']
  },
  {
    label: 'khu Thanh Khê',
    wardName: 'Phường An Khê',
    district: 'Quận Thanh Khê',
    nearbyUniversityId: 'DTU',
    latitude: 16.06191,
    longitude: 108.18149,
    jitterMeters: 760,
    streets: ['Điện Biên Phủ', 'Hà Huy Tập', 'Trường Chinh']
  }
];

const ensureWard = async (name) => {
  const existing = await prisma.ward.findFirst({ where: { name } });
  if (existing) return existing;

  return prisma.ward.create({ data: { name } });
};

const ensureAmenity = async ({ name, aliases }) => {
  const existing = await prisma.amenity.findFirst({
    where: {
      OR: [{ name }, ...aliases.map((alias) => ({ name: alias }))]
    }
  });

  if (existing) {
    return prisma.amenity.update({
      where: { id: existing.id },
      data: { name }
    });
  }

  return prisma.amenity.create({ data: { name } });
};

const toSingleRole = (roles = ['USER']) => {
  if (roles.includes('ADMIN')) return 'ADMIN';
  if (roles.includes('HOST')) return 'HOST';
  if (roles.includes('STUDENT')) return 'STUDENT';
  return 'USER';
};

const upsertUser = async ({ id, email, fullName, phone, roles, dob, gender, avatarUrl }) => {
  const hashedPassword = await getLocalPasswordHash();
  const role = toSingleRole(roles);

  return prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      phone,
      dob: dob ? new Date(dob) : null,
      gender,
      avatarUrl,
      hashedPassword,
      emailVerified: true,
      phoneVerified: true,
      status: 'ACTIVE',
      role
    },
    create: {
      ...(id ? { id } : {}),
      email,
      fullName,
      phone,
      dob: dob ? new Date(dob) : null,
      gender,
      avatarUrl,
      hashedPassword,
      emailVerified: true,
      phoneVerified: true,
      status: 'ACTIVE',
      role
    }
  });
};

const replacePostRelations = async (postId, images, postAmenities) => {
  await prisma.post_image.deleteMany({ where: { postId } });
  await prisma.post_amenity.deleteMany({ where: { postId } });

  await prisma.post_image.createMany({
    data: images.map((imageUrl) => ({ postId, imageUrl }))
  });

  await prisma.post_amenity.createMany({
    data: postAmenities.map((amenityId) => ({
      postId,
      amenityId,
      currentCondition: 'GOOD'
    }))
  });
};

const pickImages = (index) => [
  imageUrls[index % imageUrls.length],
  imageUrls[(index + 2) % imageUrls.length]
];

const pickAmenities = (amenityByName, names) => {
  return names.map((name) => amenityByName.get(name).id);
};

const pickRandomAmenityIds = (amenityByName, count, rng = random) => {
  const amenityIds = [...amenityByName.values()].map((amenity) => amenity.id);
  const shuffled = [...amenityIds].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

const runSequentially = async (items, ignoredBatchSize, handler) => {
  for (let index = 0; index < items.length; index += 1) {
    await handler(items[index], index);
  }
};

const buildLoadUsers = () => {
  const hostCount = Math.floor(LOAD_USER_COUNT * 0.44);
  const studentCount = LOAD_USER_COUNT - hostCount;
  const surnames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ'];
  const middleNames = ['Minh', 'Thanh', 'Quốc', 'Gia', 'Anh', 'Tuấn', 'Nhật', 'Hoài', 'Khánh', 'Thùy'];
  const givenNames = ['An', 'Bình', 'Châu', 'Duy', 'Hà', 'Khang', 'Linh', 'Nam', 'Phúc', 'Vy'];
  const avatars = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
  ];

  const makeName = (index) =>
    `${surnames[index % surnames.length]} ${middleNames[(index * 3) % middleNames.length]} ${givenNames[(index * 7) % givenNames.length]}`;

  const hosts = Array.from({ length: hostCount }, (_, index) => ({
    id: `usr_load_host_${String(index + 1).padStart(4, '0')}`,
    email: `host.load${String(index + 1).padStart(3, '0')}@unistay.local`,
    fullName: makeName(index),
    phone: `0912${String(index + 1).padStart(6, '0')}`,
    dob: `${randomInt(1978, 1998)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
    gender: index % 3 === 0 ? 'FEMALE' : 'MALE',
    avatarUrl: avatars[index % avatars.length],
    roles: ['USER', 'HOST']
  }));

  const students = Array.from({ length: studentCount }, (_, index) => ({
    id: `usr_load_student_${String(index + 1).padStart(4, '0')}`,
    email: `student.load${String(index + 1).padStart(3, '0')}@unistay.local`,
    fullName: makeName(index + hostCount),
    phone: `0922${String(index + 1).padStart(6, '0')}`,
    dob: `${randomInt(2001, 2007)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
    gender: index % 2 === 0 ? 'FEMALE' : 'MALE',
    avatarUrl: avatars[(index + 1) % avatars.length],
    roles: ['USER', 'STUDENT'],
    universityId: universities[index % universities.length].id
  }));

  return { hosts, students };
};

const generateLandCoordinate = (location, rng = random) => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const radius = Math.sqrt(rng()) * location.jitterMeters;
    const angle = rng() * Math.PI * 2;
    const coordinate = offsetCoordinate(
      location.latitude,
      location.longitude,
      Math.sin(angle) * radius,
      Math.cos(angle) * radius
    );

    if (!isWaterCoordinate(coordinate)) {
      return coordinate;
    }
  }

  const fallback = {
    latitude: Number(location.latitude.toFixed(6)),
    longitude: Number(location.longitude.toFixed(6))
  };

  if (isWaterCoordinate(fallback)) {
    throw new Error(`Safe listing anchor "${location.label}" is inside a water exclusion zone.`);
  }

  return fallback;
};

const assertPostsAvoidWater = (posts) => {
  const invalidPosts = posts.filter((post) =>
    isWaterCoordinate({
      latitude: Number(post.latitude),
      longitude: Number(post.longitude)
    })
  );

  if (invalidPosts.length > 0) {
    throw new Error(
      `Seed blocked because ${invalidPosts.length} listing coordinates are inside river exclusion zones: ${invalidPosts
        .slice(0, 5)
        .map((post) => `${post.id}(${post.latitude},${post.longitude})`)
        .join(', ')}`
    );
  }
};

const buildLoadPosts = (wardByName, amenityByName, hostUsers, adminId, startIndex, count) => {
  const rentTitles = [
    'Phòng trọ thoáng gần trường',
    'Căn hộ mini đầy đủ nội thất',
    'Nhà nguyên căn cho nhóm sinh viên',
    'Phòng có ban công và cửa sổ',
    'Studio yên tĩnh gần trục đường chính'
  ];
  const roommateTitles = [
    'Tìm bạn ở ghép gần trường',
    'Tìm nữ ở ghép phòng sạch sẽ',
    'Tìm nam ở ghép tiết kiệm chi phí',
    'Ở ghép khu sinh viên an ninh',
    'Tìm roommate phòng rộng thoáng'
  ];
  const descriptions = [
    'Khu vực dân cư ổn định, đường đi thuận tiện, phù hợp sinh viên cần di chuyển nhanh đến trường.',
    'Không gian gọn gàng, có chỗ để xe, chủ nhà hỗ trợ đăng ký tạm trú khi cần.',
    'Gần cửa hàng tiện lợi và các tuyến xe buýt, phù hợp lịch học linh hoạt.',
    'Khu vực yên tĩnh, ưu tiên người thuê giữ vệ sinh và sinh hoạt văn minh.',
    'Vị trí dễ tìm, hạ tầng xung quanh đầy đủ, phù hợp ở lâu dài tại Đà Nẵng.'
  ];

  return Array.from({ length: count }, (_, offset) => {
    const index = startIndex + offset;
    const location = safeListingLocations[index % safeListingLocations.length];
    const coordinate = generateLandCoordinate(location);
    const ward = wardByName.get(location.wardName) ?? wardByName.get('Phường Bình Thuận');
    const nearbyUniversity = universities.find((university) => university.id === location.nearbyUniversityId);
    const postPurpose = random() < 0.24 ? 'FIND_ROOMMATE' : 'RENT';
    const roomType = postPurpose === 'FIND_ROOMMATE' ? 'ROOM' : sample(['ROOM', 'ROOM', 'ROOM', 'APARTMENT', 'HOUSE']);
    const titleSource = postPurpose === 'FIND_ROOMMATE' ? roommateTitles : rentTitles;
    const title = `${sample(titleSource)} ${location.label} #${String(offset + 1).padStart(4, '0')}`;
    const area =
      roomType === 'HOUSE'
        ? randomInt(52, 105)
        : roomType === 'APARTMENT'
          ? randomInt(28, 58)
          : randomInt(16, 36);
    const price =
      postPurpose === 'FIND_ROOMMATE'
        ? roundTo(randomInt(1200000, 3200000), 50000)
        : roomType === 'HOUSE'
          ? roundTo(randomInt(5600000, 12500000), 100000)
          : roomType === 'APARTMENT'
            ? roundTo(randomInt(3800000, 8500000), 100000)
            : roundTo(randomInt(1600000, 4500000), 50000);
    const street = sample(location.streets);
    const exactAddress = `${randomInt(10, 260)} ${street}`;
    const amenityCount = randomInt(3, 7);
    const statusRoll = random();
    const status =
      statusRoll < 0.9
        ? 'APPROVED'
        : statusRoll < 0.96
          ? 'PENDING'
          : statusRoll < 0.99
            ? 'UPDATED'
            : 'REJECTED';
    const createdAt = new Date(Date.now() - randomInt(0, 120) * 24 * 60 * 60 * 1000 - randomInt(0, 86400) * 1000);

    return {
      id: `pst_load_${String(offset + 1).padStart(4, '0')}`,
      userId: hostUsers[index % hostUsers.length].id,
      moderatorId: status === 'APPROVED' || status === 'REJECTED' ? adminId : null,
      title,
      wardId: ward.id,
      purpose: postPurpose,
      detailAddress: `${exactAddress}, ${location.wardName}, ${location.district}, Đà Nẵng`,
      exactAddress,
      district: location.district,
      city: 'Đà Nẵng',
      area,
      price,
      deposit: roundTo(price * sample([0.3, 0.5, 1]), 50000),
      roomType,
      postPurpose,
      description: `${sample(descriptions)} ${nearbyUniversity ? `Cách ${nearbyUniversity.name} khoảng ${Math.round(distanceMeters(coordinate, nearbyUniversity) / 50) * 50}m.` : ''}`,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      status,
      rejectionReason: status === 'REJECTED' ? 'Dữ liệu mẫu: bài bị từ chối để kiểm thử trang quản trị.' : null,
      createdAt,
      updatedAt: createdAt,
      images: pickImages(index),
      amenities: pickRandomAmenityIds(amenityByName, amenityCount)
    };
  });
};

const buildPosts = (wardByName, amenityByName, hostId, adminId, loadHosts = []) => {
  const templates = [
    ['Phòng trọ gần Đại học Bách khoa', 'Phường Hòa Khánh Bắc', 'ROOM', 'RENT', 24, 2500000, '54 Nguyễn Lương Bằng', 'Quận Liên Chiểu', 16.073982, 108.149487, ['WiFi tốc độ cao', 'Máy giặt', 'Chỗ để xe']],
    ['Phòng có gác lửng khu Hòa Minh', 'Phường Hòa Minh', 'ROOM', 'RENT', 28, 3000000, '88 Tôn Đức Thắng', 'Quận Liên Chiểu', 16.07103, 108.17203, ['Gác lửng', 'WiFi tốc độ cao', 'Cửa sổ']],
    ['Căn hộ mini gần cầu Rồng', 'Phường An Hải Bắc', 'APARTMENT', 'RENT', 32, 5200000, '15 Trần Hưng Đạo', 'Quận Sơn Trà', 16.067928, 108.232012, ['Điều hòa', 'Tủ lạnh', 'Thang máy']],
    ['Tìm bạn ở ghép khu Thanh Khê', 'Phường Thanh Khê Tây', 'ROOM', 'FIND_ROOMMATE', 28, 1800000, '42 Hà Huy Tập', 'Quận Thanh Khê', 16.07084, 108.190297, ['WiFi tốc độ cao', 'Ban công', 'Máy giặt']],
    ['Nhà nguyên căn nhỏ gần biển', 'Phường Phước Mỹ', 'HOUSE', 'RENT', 55, 7500000, '29 Võ Nguyên Giáp', 'Quận Sơn Trà', 16.06122, 108.24372, ['Bếp riêng', 'Chỗ để xe', 'Camera an ninh']],
    ['Phòng sáng có ban công', 'Phường Bình Thuận', 'ROOM', 'RENT', 22, 2300000, '21 Lê Đình Dương', 'Quận Hải Châu', 16.06001, 108.21752, ['Ban công', 'Cửa sổ', 'WiFi tốc độ cao']],
    ['Căn hộ studio full nội thất', 'Phường Hòa Cường Bắc', 'APARTMENT', 'RENT', 35, 5800000, '37 Nguyễn Hữu Thọ', 'Quận Hải Châu', 16.04757, 108.2162, ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh']],
    ['Phòng trọ giá tốt khu An Khê', 'Phường An Khê', 'ROOM', 'RENT', 20, 1900000, '63 Điện Biên Phủ', 'Quận Thanh Khê', 16.06191, 108.18149, ['WiFi tốc độ cao', 'Chỗ để xe', 'Camera an ninh']],
    ['Tìm nữ ở ghép gần Duy Tân', 'Phường Thanh Khê Đông', 'ROOM', 'FIND_ROOMMATE', 26, 1600000, '254 Nguyễn Văn Linh', 'Quận Thanh Khê', 16.06991, 108.19784, ['Máy giặt', 'Bếp riêng', 'Cửa sổ']],
    ['Nhà nguyên căn cho nhóm sinh viên', 'Phường Hòa Khánh Nam', 'HOUSE', 'RENT', 70, 6800000, '105 Âu Cơ', 'Quận Liên Chiểu', 16.05846, 108.15327, ['Chỗ để xe', 'Bếp riêng', 'WiFi tốc độ cao']],
    ['Phòng trọ yên tĩnh khu Mân Thái', 'Phường Mân Thái', 'ROOM', 'RENT', 23, 2400000, '18 Hoàng Sa', 'Quận Sơn Trà', 16.08945, 108.24392, ['Cửa sổ', 'Nóng lạnh', 'Camera an ninh']],
    ['Căn hộ dịch vụ gần trung tâm', 'Phường Hòa Thuận Tây', 'APARTMENT', 'RENT', 38, 6200000, '99 Hải Phòng', 'Quận Hải Châu', 16.0671, 108.2168, ['Thang máy', 'Điều hòa', 'Tủ lạnh']],
    ['Phòng ở ghép khu Chính Gián', 'Phường Chính Gián', 'ROOM', 'FIND_ROOMMATE', 25, 1700000, '73 Nguyễn Tri Phương', 'Quận Thanh Khê', 16.06452, 108.20118, ['WiFi tốc độ cao', 'Máy giặt', 'Chỗ để xe']],
    ['Phòng rộng gần công viên', 'Phường Tân Chính', 'ROOM', 'RENT', 30, 3200000, '12 Hàm Nghi', 'Quận Thanh Khê', 16.06572, 108.21011, ['Ban công', 'Điều hòa', 'Nóng lạnh']],
    ['Căn hộ mini khu Thuận Phước', 'Phường Thuận Phước', 'APARTMENT', 'RENT', 34, 5000000, '41 Trần Phú', 'Quận Hải Châu', 16.08403, 108.22014, ['Tủ lạnh', 'Bếp riêng', 'Camera an ninh']],
    ['Nhà nguyên căn gần bến xe', 'Phường Hòa Khê', 'HOUSE', 'RENT', 60, 6500000, '201 Nguyễn Tất Thành', 'Quận Thanh Khê', 16.05974, 108.18588, ['Chỗ để xe', 'Bếp riêng', 'Máy giặt']],
    ['Phòng trọ có thang máy', 'Phường Hòa Thuận Đông', 'ROOM', 'RENT', 27, 3600000, '66 Núi Thành', 'Quận Hải Châu', 16.05431, 108.21418, ['Thang máy', 'WiFi tốc độ cao', 'Điều hòa']],
    ['Tìm bạn ở ghép khu Thọ Quang', 'Phường Thọ Quang', 'ROOM', 'FIND_ROOMMATE', 24, 1500000, '22 Lê Đức Thọ', 'Quận Sơn Trà', 16.1078, 108.25271, ['Cửa sổ', 'Chỗ để xe', 'Máy giặt']],
    ['Căn hộ gần trường Việt Hàn', 'Phường Hòa Cường Nam', 'APARTMENT', 'RENT', 36, 4800000, '470 Nam Kỳ Khởi Nghĩa', 'Quận Hải Châu', 15.9761, 108.2538, ['Điều hòa', 'Nóng lạnh', 'WiFi tốc độ cao']],
    ['Phòng trọ gần chợ Thanh Bình', 'Phường Thanh Bình', 'ROOM', 'RENT', 21, 2100000, '35 Ông Ích Khiêm', 'Quận Hải Châu', 16.07318, 108.21387, ['WiFi tốc độ cao', 'Cửa sổ', 'Chỗ để xe']]
  ];

  const templatePosts = templates.map((item, index) => {
    const [title, wardName, roomType, postPurpose, area, price, exactAddress, district, latitude, longitude, amenityNames] = item;
    const ward = wardByName.get(wardName) ?? wardByName.get('Phường Bình Thuận');
    const createdAt = new Date(Date.now() - index * 24 * 60 * 60 * 1000);

    return {
      id: `pst_seed_${String(index + 1).padStart(3, '0')}`,
      userId: hostId,
      moderatorId: adminId,
      title,
      wardId: ward.id,
      purpose: postPurpose,
      detailAddress: `${exactAddress}, ${wardName}, ${district}, Đà Nẵng`,
      exactAddress,
      district,
      city: 'Đà Nẵng',
      area,
      price,
      deposit: Math.round(price / 2),
      roomType,
      postPurpose,
      description:
        postPurpose === 'FIND_ROOMMATE'
          ? `${title}. Không gian sinh hoạt gọn gàng, khu vực thuận tiện đi lại, phù hợp với sinh viên muốn chia sẻ chi phí và ưu tiên môi trường sống văn minh.`
          : `${title}. Không gian thoáng, vị trí thuận tiện, phù hợp với sinh viên và người đi làm cần nơi ở ổn định tại Đà Nẵng.`,
      latitude,
      longitude,
      status: 'APPROVED',
      rejectionReason: null,
      createdAt,
      updatedAt: createdAt,
      images: pickImages(index),
      amenities: pickAmenities(amenityByName, amenityNames)
    };
  });

  const generatedPostCount = Math.max(0, LOAD_POST_COUNT - templatePosts.length);
  const generatedPosts = buildLoadPosts(
    wardByName,
    amenityByName,
    loadHosts.length > 0 ? loadHosts : [{ id: hostId }],
    adminId,
    templatePosts.length,
    generatedPostCount
  );
  const posts = [...templatePosts, ...generatedPosts];

  assertPostsAvoidWater(posts);

  return posts;
};

const buildLoadComments = (posts, studentUsers) => {
  const approvedPosts = posts.filter((post) => post.status === 'APPROVED');
  const rootContents = [
    'Phòng này còn trống không ạ?',
    'Có thể xem phòng vào cuối tuần này không?',
    'Khu vực này đi bộ tới trường có tiện không?',
    'Giá đã bao gồm điện nước hay chưa ạ?',
    'Mình quan tâm, chủ nhà cho xin thêm thông tin nhé.',
    'Phòng có hỗ trợ đăng ký tạm trú không ạ?'
  ];
  const replyContents = [
    'Chào bạn, phòng vẫn còn và có thể hẹn xem trực tiếp.',
    'Giá trên chưa gồm điện nước, bạn nhắn thêm để mình gửi chi tiết.',
    'Từ phòng tới trường di chuyển khá thuận tiện, đường lớn dễ đi.',
    'Có hỗ trợ đăng ký tạm trú cho người thuê dài hạn.'
  ];
  const comments = [];

  for (let index = 0; index < LOAD_COMMENT_COUNT; index += 1) {
    const isReply = index > 0 && index % 5 === 0;
    const parent = isReply ? comments[index - 1] : null;
    const post = parent ? approvedPosts.find((item) => item.id === parent.postId) : approvedPosts[(index * 7) % approvedPosts.length];
    const createdAt = new Date(Date.now() - randomInt(0, 90) * 24 * 60 * 60 * 1000 - randomInt(0, 86400) * 1000);

    comments.push({
      id: `cmt_load_${String(index + 1).padStart(4, '0')}`,
      userId: isReply ? post.userId : studentUsers[(index * 11) % studentUsers.length].id,
      postId: post.id,
      parentId: parent?.id || null,
      content: isReply ? sample(replyContents) : sample(rootContents),
      status: 'DISPLAYED',
      createdAt,
      updatedAt: createdAt
    });
  }

  return comments;
};

const buildUniquePostPairs = (posts, studentUsers, targetCount) => {
  const approvedPosts = posts.filter((post) => post.status === 'APPROVED');
  const pairs = [];
  const seen = new Set();
  let cursor = 0;

  while (pairs.length < targetCount && cursor < targetCount * 10) {
    const post = approvedPosts[(cursor * 13) % approvedPosts.length];
    const student = studentUsers[(cursor * 17) % studentUsers.length];
    const key = `${student.id}:${post.id}`;

    if (!seen.has(key)) {
      seen.add(key);
      pairs.push({ post, student });
    }

    cursor += 1;
  }

  return pairs;
};

const buildLoadReports = (posts, comments, studentUsers, adminId) => {
  const approvedPosts = posts.filter((post) => post.status === 'APPROVED');
  const reports = [];
  const pendingPostPairs = new Set();
  const pendingCommentPairs = new Set();
  let cursor = 0;

  while (reports.length < LOAD_REPORT_COUNT && cursor < LOAD_REPORT_COUNT * 20) {
    const useComment = cursor % 4 === 0;
    const status = cursor % 5 === 0 ? 'RESOLVED' : cursor % 7 === 0 ? 'REJECTED' : 'PENDING';
    const reporter = studentUsers[(cursor * 19) % studentUsers.length];
    const createdAt = new Date(Date.now() - randomInt(0, 45) * 24 * 60 * 60 * 1000 - randomInt(0, 86400) * 1000);
    let target;
    let uniqueKey;

    if (useComment) {
      const comment = comments[(cursor * 23) % comments.length];
      if (comment.userId === reporter.id) {
        cursor += 1;
        continue;
      }
      target = {
        commentId: comment.id,
        reportedUserId: comment.userId
      };
      uniqueKey = `${reporter.id}:comment:${comment.id}`;
      if (status === 'PENDING' && pendingCommentPairs.has(uniqueKey)) {
        cursor += 1;
        continue;
      }
      if (status === 'PENDING') pendingCommentPairs.add(uniqueKey);
    } else {
      const post = approvedPosts[(cursor * 29) % approvedPosts.length];
      target = {
        postId: post.id,
        reportedUserId: post.userId
      };
      uniqueKey = `${reporter.id}:post:${post.id}`;
      if (status === 'PENDING' && pendingPostPairs.has(uniqueKey)) {
        cursor += 1;
        continue;
      }
      if (status === 'PENDING') pendingPostPairs.add(uniqueKey);
    }

    reports.push({
      id: `rpt_load_${String(reports.length + 1).padStart(4, '0')}`,
      userId: reporter.id,
      ...target,
      reason: sample([
        'Dữ liệu mẫu: nội dung cần kiểm tra lại thông tin giá thuê.',
        'Dữ liệu mẫu: hình ảnh hoặc mô tả chưa rõ ràng.',
        'Dữ liệu mẫu: người dùng báo cáo nội dung chưa phù hợp.',
        'Dữ liệu mẫu: cần quản trị viên xác minh lại tiện ích.'
      ]),
      status,
      adminId: status === 'PENDING' ? null : adminId,
      adminNote: status === 'PENDING' ? null : 'Dữ liệu mẫu cho load test báo cáo.',
      createdAt,
      tackledAt: status === 'PENDING' ? null : new Date(createdAt.getTime() + 6 * 60 * 60 * 1000)
    });
    cursor += 1;
  }

  return reports;
};

const main = async () => {
  const wardByName = new Map();
  for (const wardName of wards) {
    const ward = await ensureWard(wardName);
    wardByName.set(ward.name, ward);
  }

  await prisma.university.deleteMany({
    where: {
      id: {
        notIn: universityIds
      }
    }
  });

  for (const university of universities) {
    const ward = wardByName.get(university.wardName);
    await prisma.university.upsert({
      where: { id: university.id },
      update: {
        name: university.name,
        wardId: ward.id,
        streetName: university.streetName,
        houseNumber: university.houseNumber,
        latitude: university.latitude,
        longitude: university.longitude
      },
      create: {
        id: university.id,
        name: university.name,
        wardId: ward.id,
        streetName: university.streetName,
        houseNumber: university.houseNumber,
        latitude: university.latitude,
        longitude: university.longitude
      }
    });
  }

  const amenityByName = new Map();
  for (const amenityInput of amenities) {
    const amenity = await ensureAmenity(amenityInput);
    amenityByName.set(amenity.name, amenity);
  }

  const student = await upsertUser({
    email: 'student.test@unistay.local',
    fullName: 'Nguyễn Minh Anh',
    phone: '0900000001',
    dob: '2004-08-12',
    gender: 'FEMALE',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    roles: ['USER', 'STUDENT']
  });

  const host = await upsertUser({
    email: 'host.test@unistay.local',
    fullName: 'Trần Quốc Huy',
    phone: '0900000002',
    dob: '1992-03-24',
    gender: 'MALE',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    roles: ['USER', 'HOST']
  });

  const admin = await upsertUser({
    email: 'admin.test@unistay.local',
    fullName: 'Quản trị UniStay',
    phone: '0900000003',
    dob: '1990-01-10',
    gender: 'OTHER',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    roles: ['USER', 'ADMIN']
  });

  await prisma.student.upsert({
    where: { studentId: student.id },
    update: {
      universityId: 'DUT'
    },
    create: {
      studentId: student.id,
      universityId: 'DUT'
    }
  });

  await prisma.host.upsert({
    where: { hostId: host.id },
    update: {
      isVerified: true
    },
    create: {
      hostId: host.id,
      isVerified: true
    }
  });

  const generatedUserInputs = buildLoadUsers();
  const generatedHosts = generatedUserInputs.hosts.map((input) => ({ id: input.id }));
  const generatedStudents = generatedUserInputs.students.map((input) => ({
    id: input.id,
    universityId: input.universityId
  }));

  await runSequentially(generatedUserInputs.hosts, 40, async (input, index) => {
    await upsertUser(input);
    await prisma.host.upsert({
      where: { hostId: input.id },
      update: {
        isVerified: index % 5 !== 0,
        avgStar: index % 5 === 0 ? -1 : Number((3.6 + (index % 14) * 0.1).toFixed(2))
      },
      create: {
        hostId: input.id,
        isVerified: index % 5 !== 0,
        avgStar: index % 5 === 0 ? -1 : Number((3.6 + (index % 14) * 0.1).toFixed(2))
      }
    });
  });

  await runSequentially(generatedUserInputs.students, 40, async (input) => {
    await upsertUser(input);
    await prisma.student.upsert({
      where: { studentId: input.id },
      update: {
        universityId: input.universityId
      },
      create: {
        studentId: input.id,
        universityId: input.universityId
      }
    });
  });

  const demandAmenityIds = pickAmenities(amenityByName, [
    'WiFi tốc độ cao',
    'Máy giặt',
    'Chỗ để xe',
    'Camera an ninh'
  ]);

  await prisma.student_demand.upsert({
    where: { studentId: student.id },
    update: {
      wardId: wardByName.get('Phường Hòa Khánh Bắc').id,
      universityId: 'DUT',
      minPrice: 1500000,
      maxPrice: 3500000,
      roomType: 'ROOM',
      isLookingForRoommate: true,
      roommateGender: 'ANY',
      rommateCriteria: 'WiFi tốc độ cao, máy giặt, chỗ để xe, an ninh tốt, gần trường'
    },
    create: {
      studentId: student.id,
      wardId: wardByName.get('Phường Hòa Khánh Bắc').id,
      universityId: 'DUT',
      minPrice: 1500000,
      maxPrice: 3500000,
      roomType: 'ROOM',
      isLookingForRoommate: true,
      roommateGender: 'ANY',
      rommateCriteria: 'WiFi tốc độ cao, máy giặt, chỗ để xe, an ninh tốt, gần trường'
    }
  });

  await prisma.demand_amenity.deleteMany({
    where: { studentId: student.id }
  });
  await prisma.demand_amenity.createMany({
    data: demandAmenityIds.map((amenityId) => ({
      studentId: student.id,
      amenityId
    }))
  });

  await runSequentially(generatedStudents, 40, async (generatedStudent, index) => {
    const location = safeListingLocations[index % safeListingLocations.length];
    const ward = wardByName.get(location.wardName) ?? wardByName.get('Phường Bình Thuận');
    const minPrice = roundTo(randomInt(1200000, 3500000), 50000);
    const maxPrice = minPrice + roundTo(randomInt(900000, 4500000), 50000);
    const minArea = randomInt(16, 30);
    const maxArea = minArea + randomInt(8, 35);
    const demandAmenities = pickRandomAmenityIds(amenityByName, randomInt(3, 6));
    const roomType = sample(['ROOM', 'ROOM', 'APARTMENT']);
    const isLookingForRoommate = index % 3 === 0;
    const roommateGender = index % 2 === 0 ? 'ANY' : 'SAME';
    const pricePriority = sample(['LOW', 'MEDIUM', 'HIGH']);
    const locationPriority = sample(['MEDIUM', 'HIGH']);
    const areaPriority = sample(['LOW', 'MEDIUM', 'HIGH']);
    const roommatePriority = sample(['LOW', 'MEDIUM', 'HIGH']);
    const roomTypePriority = sample(['MEDIUM', 'HIGH']);
    const amenityPriority = sample(['MEDIUM', 'HIGH']);
    const locationRadiusMeters = randomInt(1200, 4500);

    await prisma.student_demand.upsert({
      where: { studentId: generatedStudent.id },
      update: {
        wardId: ward.id,
        universityId: generatedStudent.universityId,
        locationRadiusMeters,
        minPrice,
        maxPrice,
        minArea,
        maxArea,
        roomType,
        isLookingForRoommate,
        roommateGender,
        rommateCriteria: 'Ưu tiên an ninh tốt, gần trường, chi phí hợp lý và sinh hoạt văn minh.',
        pricePriority,
        locationPriority,
        areaPriority,
        roommatePriority,
        roomTypePriority,
        amenityPriority
      },
      create: {
        studentId: generatedStudent.id,
        wardId: ward.id,
        universityId: generatedStudent.universityId,
        locationRadiusMeters,
        minPrice,
        maxPrice,
        minArea,
        maxArea,
        roomType,
        isLookingForRoommate,
        roommateGender,
        rommateCriteria: 'Ưu tiên an ninh tốt, gần trường, chi phí hợp lý và sinh hoạt văn minh.',
        pricePriority,
        locationPriority,
        areaPriority,
        roommatePriority,
        roomTypePriority,
        amenityPriority
      }
    });

    await prisma.demand_amenity.deleteMany({
      where: { studentId: generatedStudent.id }
    });
    await prisma.demand_amenity.createMany({
      data: demandAmenities.map((amenityId) => ({
        studentId: generatedStudent.id,
        amenityId
      }))
    });
  });

  const posts = buildPosts(wardByName, amenityByName, host.id, admin.id, generatedHosts);

  for (const post of posts) {
    await prisma.post.upsert({
      where: { id: post.id },
      update: {
        userId: post.userId,
        moderatorId: post.moderatorId,
        title: post.title,
        wardId: post.wardId,
        purpose: post.purpose,
        detailAddress: post.detailAddress,
        exactAddress: post.exactAddress,
        district: post.district,
        city: post.city,
        area: post.area,
        price: post.price,
        deposit: post.deposit,
        roomType: post.roomType,
        postPurpose: post.postPurpose,
        description: post.description,
        latitude: post.latitude,
        longitude: post.longitude,
        status: post.status,
        rejectionReason: post.rejectionReason,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      },
      create: {
        id: post.id,
        userId: post.userId,
        moderatorId: post.moderatorId,
        title: post.title,
        wardId: post.wardId,
        purpose: post.purpose,
        detailAddress: post.detailAddress,
        exactAddress: post.exactAddress,
        district: post.district,
        city: post.city,
        area: post.area,
        price: post.price,
        deposit: post.deposit,
        roomType: post.roomType,
        postPurpose: post.postPurpose,
        description: post.description,
        latitude: post.latitude,
        longitude: post.longitude,
        status: post.status,
        rejectionReason: post.rejectionReason,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }
    });

    await replacePostRelations(post.id, post.images, post.amenities);
  }

  const hostPostCounts = posts.reduce((counts, post) => {
    counts.set(post.userId, (counts.get(post.userId) || 0) + 1);
    return counts;
  }, new Map());

  await runSequentially([...hostPostCounts.entries()], 40, async ([hostIdForCount, totalPost]) => {
    await prisma.host.updateMany({
      where: { hostId: hostIdForCount },
      data: { totalPost }
    });
  });

  await prisma.student_favorite_post.upsert({
    where: {
      studentId_postId: {
        studentId: student.id,
        postId: posts[0].id
      }
    },
    update: {},
    create: {
      studentId: student.id,
      postId: posts[0].id
    }
  });

  for (const post of [posts[0], posts[3], posts[8]]) {
    await prisma.accomodation_request.upsert({
      where: {
        postId_userId: {
          postId: post.id,
          userId: student.id
        }
      },
      update: {
        status: 'PENDING',
        updatedAt: new Date()
      },
      create: {
        postId: post.id,
        userId: student.id,
        status: 'PENDING'
      }
    });
  }

  const generatedFavoritePairs = buildUniquePostPairs(posts, generatedStudents, LOAD_FAVORITE_COUNT);
  await runSequentially(generatedFavoritePairs, 80, async ({ post, student }) => {
    await prisma.student_favorite_post.upsert({
      where: {
        studentId_postId: {
          studentId: student.id,
          postId: post.id
        }
      },
      update: {},
      create: {
        studentId: student.id,
        postId: post.id
      }
    });
  });

  const generatedRequestPairs = buildUniquePostPairs(posts.slice().reverse(), generatedStudents, LOAD_REQUEST_COUNT);
  await runSequentially(generatedRequestPairs, 80, async ({ post, student }, index) => {
    await prisma.accomodation_request.upsert({
      where: {
        postId_userId: {
          postId: post.id,
          userId: student.id
        }
      },
      update: {
        status: index % 9 === 0 ? 'ACCEPTED' : index % 11 === 0 ? 'REJECTED' : 'PENDING',
        updatedAt: new Date()
      },
      create: {
        postId: post.id,
        userId: student.id,
        status: index % 9 === 0 ? 'ACCEPTED' : index % 11 === 0 ? 'REJECTED' : 'PENDING'
      }
    });
  });

  const seededComments = [
    {
      id: 'cmt_seed_001',
      userId: student.id,
      postId: posts[0].id,
      content: 'Phòng này gần trường, đường đi khá thuận tiện. Chủ nhà phản hồi nhanh và thông tin rõ ràng.'
    },
    {
      id: 'cmt_seed_002',
      userId: host.id,
      postId: posts[0].id,
      parentId: 'cmt_seed_001',
      content: 'Cảm ơn bạn đã quan tâm. Phòng hiện vẫn còn trống và có thể xem trực tiếp vào cuối tuần.'
    },
    {
      id: 'cmt_seed_003',
      userId: student.id,
      postId: posts[4].id,
      content: 'Khu vực này phù hợp với nhóm sinh viên cần không gian yên tĩnh và có chỗ để xe.'
    }
  ];

  for (const comment of seededComments) {
    await prisma.comment.upsert({
      where: { id: comment.id },
      update: {
        userId: comment.userId,
        postId: comment.postId,
        parentId: comment.parentId || null,
        content: comment.content,
        status: 'DISPLAYED',
        updatedAt: new Date()
      },
      create: {
        id: comment.id,
        userId: comment.userId,
        postId: comment.postId,
        parentId: comment.parentId || null,
        content: comment.content,
        status: 'DISPLAYED'
      }
    });
  }

  const loadComments = buildLoadComments(posts, generatedStudents);
  await runSequentially(loadComments, 1, async (comment) => {
    await prisma.comment.upsert({
      where: { id: comment.id },
      update: {
        userId: comment.userId,
        postId: comment.postId,
        parentId: comment.parentId,
        content: comment.content,
        status: comment.status,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt
      },
      create: {
        id: comment.id,
        userId: comment.userId,
        postId: comment.postId,
        parentId: comment.parentId,
        content: comment.content,
        status: comment.status,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt
      }
    });
  });

  const seededReports = [
    {
      id: 'rpt_seed_001',
      userId: student.id,
      reportedUserId: host.id,
      postId: posts[2].id,
      reason: 'Nội dung bài đăng cần được kiểm tra lại về thông tin giá thuê và tiện ích đi kèm.',
      status: 'PENDING'
    },
    {
      id: 'rpt_seed_002',
      userId: student.id,
      reportedUserId: host.id,
      commentId: 'cmt_seed_002',
      reason: 'Bình luận cần được quản trị viên xem xét để đảm bảo trao đổi phù hợp.',
      status: 'PENDING'
    }
  ];

  for (const report of seededReports) {
    await prisma.report.upsert({
      where: { id: report.id },
      update: {
        userId: report.userId,
        reportedUserId: report.reportedUserId,
        postId: report.postId || null,
        commentId: report.commentId || null,
        reason: report.reason,
        status: report.status,
        adminId: null,
        adminNote: null,
        tackledAt: null
      },
      create: {
        id: report.id,
        userId: report.userId,
        reportedUserId: report.reportedUserId,
        postId: report.postId || null,
        commentId: report.commentId || null,
        reason: report.reason,
        status: report.status
      }
    });
  }

  const loadReports = buildLoadReports(posts, loadComments, generatedStudents, admin.id);
  await runSequentially(loadReports, 80, async (report) => {
    await prisma.report.upsert({
      where: { id: report.id },
      update: {
        userId: report.userId,
        reportedUserId: report.reportedUserId,
        postId: report.postId || null,
        commentId: report.commentId || null,
        reason: report.reason,
        status: report.status,
        adminId: report.adminId,
        adminNote: report.adminNote,
        createdAt: report.createdAt,
        tackledAt: report.tackledAt
      },
      create: {
        id: report.id,
        userId: report.userId,
        reportedUserId: report.reportedUserId,
        postId: report.postId || null,
        commentId: report.commentId || null,
        reason: report.reason,
        status: report.status,
        adminId: report.adminId,
        adminNote: report.adminNote,
        createdAt: report.createdAt,
        tackledAt: report.tackledAt
      }
    });
  });

  console.log(`Đã khởi tạo ${wards.length} phường, ${universities.length} trường, ${amenities.length} tiện ích.`);
  console.log(`Đã seed ${LOAD_USER_COUNT} user load test, ${posts.length} bài đăng, ${loadComments.length + seededComments.length} bình luận, ${loadReports.length + seededReports.length} báo cáo.`);
  console.log('Tọa độ bài đăng đã qua bộ kiểm tra loại vùng sông Hàn/Cẩm Lệ/Cu Đê trước khi ghi DB.');
  console.log('student.test@unistay.local / Test@123456');
  console.log('host.test@unistay.local / Test@123456');
  console.log('admin.test@unistay.local / Test@123456');
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
