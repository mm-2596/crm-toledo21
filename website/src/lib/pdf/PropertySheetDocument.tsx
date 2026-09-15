import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { PropertyDetailResponse } from "@/lib/types";
import {
  conditionLabels,
  formatCurrency,
  heatingLabels,
  listingTypeLabels,
  propertyTypeLabels,
} from "@/lib/format";

const INK = "#14110f";
const INK_SOFT = "#5c564d";
const GOLD = "#a9834f";
const PAPER_DIM = "#f1ede4";
const LINE = "#e4ddd0";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 90,
    paddingHorizontal: 40,
    fontSize: 10,
    color: INK,
    fontFamily: "Helvetica",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: { width: 110, height: 39, objectFit: "contain" },
  headerMeta: { alignItems: "flex-end" },
  eyebrow: {
    fontSize: 8,
    color: GOLD,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  reference: { fontSize: 9, color: INK_SOFT },
  cover: { width: "100%", height: 260, objectFit: "cover", borderRadius: 4 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 16,
  },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", maxWidth: 340 },
  location: { fontSize: 10, color: INK_SOFT, marginTop: 4 },
  price: { fontSize: 22, fontFamily: "Helvetica-Bold", color: GOLD },
  specsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: LINE,
  },
  specItem: { fontSize: 9.5, color: INK_SOFT },
  specValue: { fontFamily: "Helvetica-Bold", color: INK },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 18,
    marginBottom: 6,
  },
  description: { fontSize: 9.5, lineHeight: 1.5, color: INK_SOFT },
  featuresGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  featureChip: {
    fontSize: 8.5,
    backgroundColor: PAPER_DIM,
    color: INK,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginRight: 6,
    marginBottom: 6,
  },
  dataGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4, gap: 20 },
  dataItem: { fontSize: 9 },
  dataLabel: { color: INK_SOFT, fontSize: 8 },
  agentBox: {
    marginTop: 18,
    padding: 14,
    backgroundColor: PAPER_DIM,
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  agentName: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  agentContact: { fontSize: 9, color: INK_SOFT, marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: INK,
    color: "#faf8f4",
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  footerTagline: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
    marginBottom: 4,
  },
  footerLine: { fontSize: 8.5, color: "#d8d2c6" },
});

function Spec({ label, value }: { label: string; value: string | number }) {
  return (
    <Text style={styles.specItem}>
      <Text style={styles.specValue}>{value}</Text> {label}
    </Text>
  );
}

export function PropertySheetDocument({
  property,
  logoUrl,
  websiteUrl,
}: {
  property: PropertyDetailResponse;
  logoUrl: string;
  websiteUrl: string;
}) {
  const location = [property.address, property.zone, property.city].filter(Boolean).join(", ") || "Toledo";
  const cover = property.images[0]?.url;

  const features = [
    property.hasElevator && "Ascensor",
    property.parkingSpaces ? `${property.parkingSpaces} plaza(s) de garaje` : null,
    property.hasAirConditioning && "Aire acondicionado",
    property.hasTerrace && "Terraza",
    property.hasBalcony && "Balcón",
    property.hasGarden && "Jardín",
    property.hasPool && "Piscina",
    property.hasStorageRoom && "Trastero",
    property.isFurnished && "Amueblado",
    property.isExterior && "Exterior",
  ].filter(Boolean) as string[];

  return (
    <Document
      title={property.title}
      author="Toledo21"
      subject={`Ficha de propiedad — Ref. ${property.reference}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <Image src={logoUrl} style={styles.logo} />
          <View style={styles.headerMeta}>
            <Text style={styles.eyebrow}>Ficha de propiedad</Text>
            <Text style={styles.reference}>Ref. {property.reference}</Text>
          </View>
        </View>

        {cover && <Image src={cover} style={styles.cover} />}

        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>{property.title}</Text>
            <Text style={styles.location}>{location}</Text>
          </View>
          <Text style={styles.price}>{formatCurrency(property.price)}</Text>
        </View>

        <View style={styles.specsRow}>
          <Text style={styles.specItem}>
            {listingTypeLabels[property.listingType]} · {propertyTypeLabels[property.type]}
          </Text>
          {property.bedrooms != null && <Spec label="habitaciones" value={property.bedrooms} />}
          {property.bathrooms != null && <Spec label="baños" value={property.bathrooms} />}
          {property.areaM2 != null && <Spec label="m² construidos" value={property.areaM2} />}
          {property.yearBuilt != null && <Spec label="año construcción" value={property.yearBuilt} />}
        </View>

        {property.description && (
          <View>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>
        )}

        {features.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Características</Text>
            <View style={styles.featuresGrid}>
              {features.map((f) => (
                <Text key={f} style={styles.featureChip}>
                  {f}
                </Text>
              ))}
            </View>
          </View>
        )}

        {(property.condition || property.energyRating || property.hoaFees != null || property.heating) && (
          <View>
            <Text style={styles.sectionTitle}>Datos adicionales</Text>
            <View style={styles.dataGrid}>
              {property.condition && (
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Estado</Text>
                  <Text>{conditionLabels[property.condition]}</Text>
                </View>
              )}
              {property.heating && (
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Calefacción</Text>
                  <Text>{heatingLabels[property.heating]}</Text>
                </View>
              )}
              {property.hoaFees != null && (
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Gastos de comunidad</Text>
                  <Text>{formatCurrency(property.hoaFees)}/mes</Text>
                </View>
              )}
              {property.energyRating && (
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Certificado energético</Text>
                  <Text>
                    {property.energyRating}
                    {property.energyConsumptionValue ? ` (${property.energyConsumptionValue} kWh/m² año)` : ""}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {property.agent && (
          <View style={styles.agentBox}>
            <View>
              <Text style={styles.agentName}>{property.agent.name}</Text>
              <Text style={styles.agentContact}>{property.agent.email}</Text>
              {property.agent.phone && <Text style={styles.agentContact}>{property.agent.phone}</Text>}
            </View>
            <Text style={{ fontSize: 8.5, color: INK_SOFT }}>Tu agente en Toledo21</Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerTagline}>Imagínate viviendo aquí.</Text>
          <Text style={styles.footerLine}>
            Toledo21 · {websiteUrl.replace(/^https?:\/\//, "")} · Esta ficha es solo informativa y no constituye
            oferta vinculante.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
