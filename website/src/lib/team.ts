// Equipo que se muestra en /equipo. Para añadir, quitar o cambiar a alguien, se edita esta lista.
// «qrUrl» es la dirección a la que lleva el QR de cada persona.

// Provisional: apunta a la web principal hasta que se indique la dirección definitiva.
const QR_URL_PROVISIONAL = "https://toledofinal.neuraltech.pro";

export interface TeamMember {
  name: string;
  role: string;
  qrUrl: string;
}

export interface TeamGroup {
  office: string;
  members: TeamMember[];
}

export const TEAM: TeamGroup[] = [
  {
    office: "Toledo 21 Madrid",
    members: [
      { name: "Ventura Valiente", role: "Director", qrUrl: QR_URL_PROVISIONAL },
      { name: "Angeles Marugán", role: "Agente", qrUrl: QR_URL_PROVISIONAL },
      { name: "Fao Assadiki", role: "Agente", qrUrl: QR_URL_PROVISIONAL },
    ],
  },
  {
    office: "Toledo 21 Puerto de Sagunto",
    members: [
      { name: "Raúl Marugan Pérez", role: "Agente", qrUrl: QR_URL_PROVISIONAL },
      { name: "Isabel Ruiz López", role: "Agente", qrUrl: QR_URL_PROVISIONAL },
      { name: "Anastasia Shishova", role: "Agente", qrUrl: QR_URL_PROVISIONAL },
    ],
  },
];
