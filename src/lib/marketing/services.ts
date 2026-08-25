export type Service = {
  slug: string;
  name: string;
  shortDescription: string;
  problem: string;
  solution: string;
  suitableFor: string[];
  components: string[];
  considerations: string;
};

export const SERVICES: Service[] = [
  {
    slug: "cctv-installation",
    name: "CCTV & IP Camera Installation",
    shortDescription: "Camera selection, placement, and installation for full property coverage.",
    problem:
      "Blind spots and poorly placed cameras mean a system that looks installed but doesn't actually cover the areas that matter — entry points, parking, boundaries, and high-traffic zones.",
    solution:
      "We plan camera placement around your property's actual layout and risk areas, then install and configure cameras, recorder, storage, and remote viewing so the system does what it's meant to.",
    suitableFor: ["Homes", "Shops and retail", "Restaurants", "Small and large offices", "Warehouses and industrial sites"],
    components: ["IP or analog HD cameras", "DVR/NVR recorder", "Storage", "Cabling and power", "Remote/mobile viewing setup"],
    considerations:
      "Camera count, coverage requirements, and cable runs affect cost. Larger or more complex properties are typically routed to a site survey rather than an online estimate.",
  },
  {
    slug: "cctv-repair-maintenance",
    name: "CCTV Repair & Maintenance",
    shortDescription: "Diagnostics and repair for existing DVR, NVR, and camera systems.",
    problem:
      "An existing CCTV system that's stopped recording, lost remote access, or has failed cameras isn't protecting anything — even though the hardware is still there.",
    solution:
      "We diagnose the fault — camera, cabling, recorder, storage, network, or power — and repair or replace only what's actually needed.",
    suitableFor: ["Any property with an existing CCTV system that isn't working correctly"],
    components: ["Fault diagnosis", "Camera/DVR/NVR repair or replacement", "Cabling repair", "Storage replacement"],
    considerations: "Repair cost depends on the fault. Some issues are resolved same-visit; others need parts sourced first.",
  },
  {
    slug: "access-control",
    name: "Access Control & Biometric Systems",
    shortDescription: "Door access, biometric attendance, and entry-management systems.",
    problem:
      "Shared keys and manual attendance registers are easy to lose control of — no record of who came in, when, or whether a former employee still has access.",
    solution:
      "We install card, PIN, or biometric access control at the doors that matter, with logging so you know who accessed what and when.",
    suitableFor: ["Offices", "Warehouses", "Residential buildings", "Businesses tracking staff attendance"],
    components: ["Biometric/card readers", "Door controllers and locks", "Attendance software where applicable"],
    considerations: "Number of doors/users and whether attendance tracking is needed affect system size.",
  },
  {
    slug: "fire-alarm",
    name: "Fire Alarm Systems",
    shortDescription: "Detection and alarm systems for homes, shops, and commercial properties.",
    problem: "Fire risk isn't always visible until it's too late — early detection is what makes the difference.",
    solution: "We install detection and alarm systems sized to your property, from single-zone setups to multi-floor buildings.",
    suitableFor: ["Homes", "Shops", "Offices", "Commercial and multi-floor properties"],
    components: ["Smoke/heat detectors", "Alarm panel", "Sounders/notification devices", "Wiring"],
    considerations:
      "Fire alarm systems typically require a site survey rather than an online estimate, given the safety-critical nature of correct coverage and zoning.",
  },
  {
    slug: "video-intercom",
    name: "Video Intercom",
    shortDescription: "Door-phone and video intercom systems for houses and apartment buildings.",
    problem: "Not knowing who's at the door before opening it is a basic but real security gap.",
    solution: "We install video door-phone systems so you can see and speak with visitors before granting entry.",
    suitableFor: ["Homes", "Apartment buildings", "Gated properties"],
    components: ["Door station (camera + speaker)", "Indoor monitor or mobile app", "Wiring or wireless setup"],
    considerations: "Single-unit vs. multi-unit (apartment building) setups differ significantly in equipment and cost.",
  },
  {
    slug: "intrusion-security",
    name: "Intrusion & Security Systems",
    shortDescription: "Alarm and intrusion-detection systems for perimeter and interior protection.",
    problem: "CCTV records an intrusion — it doesn't stop or announce one while it's happening.",
    solution: "We install motion sensors, door/window contacts, and alarm systems that alert you in real time.",
    suitableFor: ["Homes", "Shops", "Warehouses", "Properties needing perimeter protection"],
    components: ["Motion sensors", "Door/window contacts", "Alarm panel and siren", "Optional remote alerting"],
    considerations: "Like fire alarm systems, intrusion systems typically require a site survey before a final quotation.",
  },
  {
    slug: "networking",
    name: "Networking & Structured Cabling",
    shortDescription: "PoE networking and structured cabling to support your security systems.",
    problem: "IP cameras, access control, and network video recorders all depend on cabling and networking that's often an afterthought.",
    solution: "We design and install the PoE networking and structured cabling your security systems actually need to run reliably.",
    suitableFor: ["Any property installing IP-based CCTV, access control, or networked security equipment"],
    components: ["PoE switches", "Structured cabling", "Network configuration"],
    considerations: "Often bundled with a CCTV or access-control installation rather than sold standalone.",
  },
  {
    slug: "maintenance-amc",
    name: "Maintenance & AMC",
    shortDescription: "Ongoing maintenance and annual maintenance contracts to keep systems running.",
    problem: "Security systems degrade quietly — a camera going dark or storage filling up often isn't noticed until it's needed.",
    solution: "Regular maintenance and annual maintenance contracts (AMC) catch problems before they matter.",
    suitableFor: ["Any property with an installed security system"],
    components: ["Scheduled inspections", "Preventive maintenance", "Priority repair response under AMC"],
    considerations: "AMC terms vary by system size and number of devices covered.",
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
