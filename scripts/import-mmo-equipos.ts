/**
 * Script de importación: MMO FEB-26.xlsx + EQUIPOS.xlsx
 *
 * Actualiza las categorías de mano de obra con tarifas de febrero 2026
 * e inserta los equipos del catálogo genérico y del proyecto.
 *
 * Uso: pnpm tsx scripts/import-mmo-equipos.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error('No se encontró ninguna organización en la base de datos');
  console.log(`\n🏢 Organización: ${org.name} (${org.id})\n`);

  // ============================================================
  // CATEGORÍAS DE MANO DE OBRA — MMO FEB-26.xlsx
  // ============================================================
  console.log('👷 Actualizando categorías de Mano de Obra (MMO Feb-26)...');

  const attendancePct  = 0.20;   // Presentismo
  const socialChargesPct = 0.59; // Cargas sociales (según planilla)
  const artPct         = 0.079;  // ART

  const laborCategories = [
    { code: 'OF-ESP', name: 'Oficial Especializado', baseSalaryPerHour: 6071 },
    { code: 'OF',     name: 'Oficial',               baseSalaryPerHour: 5196 },
    { code: 'MO',     name: 'Medio Oficial',         baseSalaryPerHour: 4793 },
    { code: 'AY',     name: 'Ayudante',              baseSalaryPerHour: 4438 },
  ];

  for (const lc of laborCategories) {
    const totalHourlyCost = parseFloat(
      (lc.baseSalaryPerHour * (1 + attendancePct) * (1 + socialChargesPct) * (1 + artPct)).toFixed(2),
    );
    await prisma.laborCategory.upsert({
      where: { code: lc.code },
      create: {
        code: lc.code,
        name: lc.name,
        baseSalaryPerHour: lc.baseSalaryPerHour,
        attendancePct,
        socialChargesPct,
        artPct,
        totalHourlyCost,
        organizationId: org.id,
      },
      update: {
        name: lc.name,
        baseSalaryPerHour: lc.baseSalaryPerHour,
        attendancePct,
        socialChargesPct,
        artPct,
        totalHourlyCost,
      },
    });
    console.log(`   ✅ ${lc.name}: $${lc.baseSalaryPerHour}/h base → $${totalHourlyCost.toFixed(2)}/h total`);
  }

  // ============================================================
  // CATÁLOGO DE EQUIPOS — EQUIPOS.xlsx "Equipos" sheet (genérico)
  // ============================================================
  console.log('\n🚧 Insertando equipos del catálogo genérico (planilla EQUIPOS)...');

  // Valores precalculados con: dólar=1390, gas oil=1917
  // Fórmulas: amort=(VN*0.9/10000 + VN*0.1/4000), reparaciones=0.8*VN/10000
  //           combustible=HP/6.75*precioGasOil, lubricantes=0.25*combustible
  const genericEquipment = [
    { code: 'EQ-GEN-01', name: 'Aserradora de Juntas',                         description: 'Catálogo genérico - 2.720 USD',    powerHp: 45,  newValue: 3780800,    amortPerHour: 434.79,   repairsPerHour: 302.46, fuelPerHour: 12772.0,  lubricantsPerHour: 3193.0,  totalHourlyCost: 16702.25  },
    { code: 'EQ-GEN-02', name: 'Camión Regador de Agua',                        description: 'Catálogo genérico - 6.000 USD',    powerHp: 140, newValue: 8340000,    amortPerHour: 958.1,    repairsPerHour: 667.2,  fuelPerHour: 39742.0,  lubricantsPerHour: 9935.5,  totalHourlyCost: 51302.8   },
    { code: 'EQ-GEN-03', name: 'Camión Chasis',                                 description: 'Catálogo genérico - 13.750 USD',   powerHp: 340, newValue: 19112500,   amortPerHour: 2197.94,  repairsPerHour: 1529.0, fuelPerHour: 96507.0,  lubricantsPerHour: 24126.75,totalHourlyCost: 124360.69 },
    { code: 'EQ-GEN-04', name: 'Cargadora Frontal sobre Neumáticos',            description: 'Catálogo genérico - 174.150 USD',  powerHp: 140, newValue: 242068500,  amortPerHour: 27837.88, repairsPerHour: 19365.48,fuelPerHour: 39742.0,  lubricantsPerHour: 9935.5,  totalHourlyCost: 96880.86  },
    { code: 'EQ-GEN-05', name: 'Motocompresor con Martillos',                   description: 'Catálogo genérico - 42.000 USD',   powerHp: 65,  newValue: 58380000,   amortPerHour: 6713.7,   repairsPerHour: 4670.4, fuelPerHour: 18450.0,  lubricantsPerHour: 4612.5,  totalHourlyCost: 34446.6   },
    { code: 'EQ-GEN-06', name: 'Equipos Menores y Herramientas de Mano',        description: 'Catálogo genérico - 13.000 USD',   powerHp: null,newValue: 18070000,   amortPerHour: 2078.05,  repairsPerHour: 1445.6, fuelPerHour: 0,        lubricantsPerHour: 0,       totalHourlyCost: 3523.65   },
    { code: 'EQ-GEN-07', name: 'Guinche de Cable con Cuchara tipo Almeja',      description: 'Catálogo genérico - 35.000 USD',   powerHp: 150, newValue: 48650000,   amortPerHour: 5594.75,  repairsPerHour: 3892.0, fuelPerHour: 42570.0,  lubricantsPerHour: 10642.5, totalHourlyCost: 62699.25  },
    { code: 'EQ-GEN-08', name: 'Reclamadora',                                   description: 'Catálogo genérico - 600.000 USD',  powerHp: 600, newValue: 834000000,  amortPerHour: 95910.0,  repairsPerHour: 66720.0,fuelPerHour: 170280.0, lubricantsPerHour: 42570.0, totalHourlyCost: 375480.0  },
    { code: 'EQ-GEN-09', name: 'Camión Motohormigonero (Genérico)',             description: 'Catálogo genérico - 130.000 USD',  powerHp: 205, newValue: 180700000,  amortPerHour: 20780.5,  repairsPerHour: 14456.0,fuelPerHour: 58188.0,  lubricantsPerHour: 14547.0, totalHourlyCost: 107971.5  },
    { code: 'EQ-GEN-10', name: 'Motoniveladora',                                description: 'Catálogo genérico - 150.000 USD',  powerHp: 120, newValue: 208500000,  amortPerHour: 23977.5,  repairsPerHour: 16680.0,fuelPerHour: 34056.0,  lubricantsPerHour: 8514.0,  totalHourlyCost: 83227.5   },
    { code: 'EQ-GEN-11', name: 'Grúa 20 tn',                                   description: 'Catálogo genérico - 11.000 USD',   powerHp: 140, newValue: 15290000,   amortPerHour: 1758.35,  repairsPerHour: 1223.2, fuelPerHour: 39742.0,  lubricantsPerHour: 9935.5,  totalHourlyCost: 52659.05  },
    { code: 'EQ-GEN-12', name: 'Camión Volcador',                               description: 'Catálogo genérico - 55.000 USD',   powerHp: 150, newValue: 76450000,   amortPerHour: 8791.75,  repairsPerHour: 6116.0, fuelPerHour: 42570.0,  lubricantsPerHour: 10642.5, totalHourlyCost: 68120.25  },
    { code: 'EQ-GEN-13', name: 'Retroexcavadora (Genérico)',                    description: 'Catálogo genérico - 180.000 USD',  powerHp: 120, newValue: 250200000,  amortPerHour: 28773.0,  repairsPerHour: 20016.0,fuelPerHour: 34056.0,  lubricantsPerHour: 8514.0,  totalHourlyCost: 91359.0   },
    { code: 'EQ-GEN-14', name: 'Rastra de Discos',                              description: 'Catálogo genérico - 3.500 USD',    powerHp: null,newValue: 4865000,    amortPerHour: 559.48,   repairsPerHour: 389.2,  fuelPerHour: 0,        lubricantsPerHour: 0,       totalHourlyCost: 948.68    },
    { code: 'EQ-GEN-15', name: 'Retropala 4x4',                                 description: 'Catálogo genérico - 42.000 USD',   powerHp: 100, newValue: 58380000,   amortPerHour: 6713.7,   repairsPerHour: 4670.4, fuelPerHour: 28380.0,  lubricantsPerHour: 7095.0,  totalHourlyCost: 46859.1   },
    { code: 'EQ-GEN-16', name: 'Camión Tractor',                                description: 'Catálogo genérico - 40.000 USD',   powerHp: 140, newValue: 55600000,   amortPerHour: 6394.0,   repairsPerHour: 4448.0, fuelPerHour: 39742.0,  lubricantsPerHour: 9935.5,  totalHourlyCost: 60519.5   },
    { code: 'EQ-GEN-17', name: 'Equipo para Demarcación Vial Horizontal',       description: 'Catálogo genérico - 4.200 USD',    powerHp: 180, newValue: 5838000,    amortPerHour: 671.37,   repairsPerHour: 467.04, fuelPerHour: 51084.0,  lubricantsPerHour: 12771.0, totalHourlyCost: 64993.41  },
    { code: 'EQ-GEN-18', name: 'Rodillo Neumático Autopropulsado',              description: 'Catálogo genérico - 90.000 USD',   powerHp: 125, newValue: 125100000,  amortPerHour: 14386.5,  repairsPerHour: 10008.0,fuelPerHour: 35475.0,  lubricantsPerHour: 8868.75, totalHourlyCost: 68738.25  },
    { code: 'EQ-GEN-19', name: 'Rodillo Neumático de Arrastre',                 description: 'Catálogo genérico - 13.400 USD',   powerHp: null,newValue: 18626000,   amortPerHour: 2141.99,  repairsPerHour: 1490.08,fuelPerHour: 0,        lubricantsPerHour: 0,       totalHourlyCost: 3632.07   },
    { code: 'EQ-GEN-20', name: 'Rodillo Pata de Cabra de Arrastre',             description: 'Catálogo genérico - 35.000 USD',   powerHp: null,newValue: 48650000,   amortPerHour: 5594.75,  repairsPerHour: 3892.0, fuelPerHour: 0,        lubricantsPerHour: 0,       totalHourlyCost: 9486.75   },
    { code: 'EQ-GEN-21', name: 'Rodillo Pata de Cabra Autopropulsado',          description: 'Catálogo genérico - 70.000 USD',   powerHp: 112, newValue: 97300000,   amortPerHour: 11189.5,  repairsPerHour: 7784.0, fuelPerHour: 31793.0,  lubricantsPerHour: 7948.25, totalHourlyCost: 58714.75  },
    { code: 'EQ-GEN-22', name: 'Equipo Rompepavimentos',                        description: 'Catálogo genérico - 90.000 USD',   powerHp: 120, newValue: 125100000,  amortPerHour: 14386.5,  repairsPerHour: 10008.0,fuelPerHour: 34056.0,  lubricantsPerHour: 8514.0,  totalHourlyCost: 66964.5   },
    { code: 'EQ-GEN-23', name: 'Terminadora de Pavimentos de Hormigón',         description: 'Catálogo genérico - 120.000 USD',  powerHp: 300, newValue: 166800000,  amortPerHour: 19182.0,  repairsPerHour: 13344.0,fuelPerHour: 85140.0,  lubricantsPerHour: 21285.0, totalHourlyCost: 138951.0  },
    { code: 'EQ-GEN-24', name: 'Tractor sobre Neumático 4x2',                   description: 'Catálogo genérico - 40.000 USD',   powerHp: 150, newValue: 55600000,   amortPerHour: 6394.0,   repairsPerHour: 4448.0, fuelPerHour: 42570.0,  lubricantsPerHour: 10642.5, totalHourlyCost: 64054.5   },
    { code: 'EQ-GEN-25', name: 'Vibrocompactador Manual',                       description: 'Catálogo genérico - 3.100 USD',    powerHp: 4,   newValue: 4309000,    amortPerHour: 495.54,   repairsPerHour: 344.72, fuelPerHour: 1135.0,   lubricantsPerHour: 283.75,  totalHourlyCost: 2259.01   },
    { code: 'EQ-GEN-26', name: 'Camión Regador de Asfalto',                     description: 'Catálogo genérico - 100.000 USD',  powerHp: 145, newValue: 139000000,  amortPerHour: 15985.0,  repairsPerHour: 11120.0,fuelPerHour: 41152.0,  lubricantsPerHour: 10288.0, totalHourlyCost: 78545.0   },
    { code: 'EQ-GEN-27', name: 'Rodillo Liso Vibratorio Autopropulsado',        description: 'Catálogo genérico - 75.000 USD',   powerHp: 70,  newValue: 104250000,  amortPerHour: 11988.75, repairsPerHour: 8340.0, fuelPerHour: 19866.0,  lubricantsPerHour: 4966.5,  totalHourlyCost: 45161.25  },
    { code: 'EQ-GEN-28', name: 'Terminadora de Pavimentos Asfálticos',          description: 'Catálogo genérico - 243.000 USD',  powerHp: 150, newValue: 337770000,  amortPerHour: 38843.55, repairsPerHour: 27021.6,fuelPerHour: 42570.0,  lubricantsPerHour: 10642.5, totalHourlyCost: 119077.65 },
    { code: 'EQ-GEN-29', name: 'Planta Asfáltica Completa',                     description: 'Catálogo genérico - 644.000 USD',  powerHp: 330, newValue: 895160000,  amortPerHour: 102943.4, repairsPerHour: 71612.8,fuelPerHour: 93643.0,  lubricantsPerHour: 23410.75,totalHourlyCost: 291609.95 },
    { code: 'EQ-GEN-30', name: 'Aplanadora',                                    description: 'Catálogo genérico - 55.000 USD',   powerHp: 70,  newValue: 76450000,   amortPerHour: 8791.75,  repairsPerHour: 6116.0, fuelPerHour: 19866.0,  lubricantsPerHour: 4966.5,  totalHourlyCost: 39740.25  },
    { code: 'EQ-GEN-31', name: 'Fresadora de Pavimentos',                       description: 'Catálogo genérico - 500.000 USD',  powerHp: 400, newValue: 695000000,  amortPerHour: 79925.0,  repairsPerHour: 55600.0,fuelPerHour: 113520.0, lubricantsPerHour: 28380.0, totalHourlyCost: 277425.0  },
    { code: 'EQ-GEN-32', name: 'Hidrogrúa',                                     description: 'Catálogo genérico - 11.000 USD',   powerHp: 150, newValue: 15290000,   amortPerHour: 1758.35,  repairsPerHour: 1223.2, fuelPerHour: 42570.0,  lubricantsPerHour: 10642.5, totalHourlyCost: 56194.05  },
    { code: 'EQ-GEN-33', name: 'Minicargadora',                                 description: 'Catálogo genérico - 125.000 USD',  powerHp: 71,  newValue: 173750000,  amortPerHour: 19981.25, repairsPerHour: 13900.0,fuelPerHour: 20152.0,  lubricantsPerHour: 5038.0,  totalHourlyCost: 59071.25  },
  ];

  for (const eq of genericEquipment) {
    await prisma.equipmentCatalogItem.upsert({
      where: { code: eq.code },
      create: {
        code: eq.code,
        name: eq.name,
        description: eq.description,
        powerHp: eq.powerHp,
        newValue: eq.newValue,
        residualPct: 0.10,
        usefulLifeHours: 10000,
        amortPerHour: eq.amortPerHour,
        repairsPerHour: eq.repairsPerHour,
        fuelPerHour: eq.fuelPerHour,
        lubricantsPerHour: eq.lubricantsPerHour,
        totalHourlyCost: eq.totalHourlyCost,
        organizationId: org.id,
      },
      update: {
        name: eq.name,
        description: eq.description,
        powerHp: eq.powerHp,
        newValue: eq.newValue,
        amortPerHour: eq.amortPerHour,
        repairsPerHour: eq.repairsPerHour,
        fuelPerHour: eq.fuelPerHour,
        lubricantsPerHour: eq.lubricantsPerHour,
        totalHourlyCost: eq.totalHourlyCost,
      },
    });
    console.log(`   ✅ ${eq.code}: ${eq.name}`);
  }

  // ============================================================
  // CATÁLOGO DE EQUIPOS — EQUIPOS.xlsx "equipo" sheet (proyecto)
  // ============================================================
  console.log('\n🚜 Insertando equipos del proyecto (planilla equipo)...');

  // Valores tomados directamente de la planilla con data_only=True
  // dólar=1450, gas oil=1917, aceites=10000
  const projectEquipment = [
    { code: 'EQ-PRY-01', name: 'Manitou - Autoelevadora',                      description: 'Año 2013',         powerHp: 60,  newValue: 116000000,  amortPerHour: 11600, repairsPerHour: 5800,  fuelPerHour: 11502, lubricantsPerHour: 6000,  totalHourlyCost: 34902  },
    { code: 'EQ-PRY-02', name: 'IVECO - Camión Chasis c/Cabina Dormitorio',    description: 'Año 2021',         powerHp: 250, newValue: 130500000,  amortPerHour: 13050, repairsPerHour: 6525,  fuelPerHour: 47925, lubricantsPerHour: 25000, totalHourlyCost: 92500  },
    { code: 'EQ-PRY-03', name: 'IVECO - Camión Chasis Volcadora y Grúa',       description: 'Año 2023',         powerHp: 200, newValue: 188500000,  amortPerHour: 18850, repairsPerHour: 9425,  fuelPerHour: 38340, lubricantsPerHour: 20000, totalHourlyCost: 86615  },
    { code: 'EQ-PRY-04', name: 'IVECO - Camión Chasis c/Cabina',               description: 'Año 2021',         powerHp: 200, newValue: 130500000,  amortPerHour: 13050, repairsPerHour: 6525,  fuelPerHour: 38340, lubricantsPerHour: 20000, totalHourlyCost: 77915  },
    { code: 'EQ-PRY-05', name: 'Patronelli - Acoplado',                        description: 'Año 2022',         powerHp: null,newValue: 50750000,   amortPerHour: 5075,  repairsPerHour: 2538,  fuelPerHour: 0,     lubricantsPerHour: 0,     totalHourlyCost: 7613   },
    { code: 'EQ-PRY-06', name: 'New Holland - Cargadora L220',                 description: 'Año 2019',         powerHp: 150, newValue: 50750000,   amortPerHour: 5075,  repairsPerHour: 2538,  fuelPerHour: 28755, lubricantsPerHour: 15000, totalHourlyCost: 51368  },
    { code: 'EQ-PRY-07', name: 'Case - Cargadora 580 L',                       description: 'Año 2006',         powerHp: 130, newValue: 58000000,   amortPerHour: 5800,  repairsPerHour: 2900,  fuelPerHour: 24921, lubricantsPerHour: 13000, totalHourlyCost: 46621  },
    { code: 'EQ-PRY-08', name: 'Ford Transit - Camión Chasis c/Cabina',        description: 'Año 2014',         powerHp: 130, newValue: 26100000,   amortPerHour: 2610,  repairsPerHour: 1305,  fuelPerHour: 24921, lubricantsPerHour: 13000, totalHourlyCost: 41836  },
    { code: 'EQ-PRY-09', name: 'Toyota - Camioneta Pick-Up',                   description: 'Año 2016',         powerHp: 170, newValue: 27550000,   amortPerHour: 2755,  repairsPerHour: 1378,  fuelPerHour: 32589, lubricantsPerHour: 17000, totalHourlyCost: 53722  },
    { code: 'EQ-PRY-10', name: 'Toyota Hilux 4x4 - Pick-Up',                   description: 'Año 2012',         powerHp: 170, newValue: 26100000,   amortPerHour: 2610,  repairsPerHour: 1305,  fuelPerHour: 32589, lubricantsPerHour: 17000, totalHourlyCost: 53504  },
    { code: 'EQ-PRY-11', name: 'Toyota Hilux 4x4 - Pick-Up (2022-A)',          description: 'Año 2022',         powerHp: 170, newValue: 43500000,   amortPerHour: 4350,  repairsPerHour: 2175,  fuelPerHour: 32589, lubricantsPerHour: 17000, totalHourlyCost: 56114  },
    { code: 'EQ-PRY-12', name: 'Toyota Hilux 4x4 - Pick-Up (2022-B)',          description: 'Año 2022',         powerHp: 170, newValue: 43500000,   amortPerHour: 4350,  repairsPerHour: 2175,  fuelPerHour: 32589, lubricantsPerHour: 17000, totalHourlyCost: 56114  },
    { code: 'EQ-PRY-13', name: 'Toyota Hilux 4x4 - Pick-Up (2020)',            description: 'Año 2020',         powerHp: 170, newValue: 29000000,   amortPerHour: 2900,  repairsPerHour: 1450,  fuelPerHour: 32589, lubricantsPerHour: 17000, totalHourlyCost: 53939  },
    { code: 'EQ-PRY-14', name: 'Toyota Hilux 4x4 - Pick-Up (2019)',            description: 'Año 2019',         powerHp: 170, newValue: 27550000,   amortPerHour: 2755,  repairsPerHour: 1378,  fuelPerHour: 32589, lubricantsPerHour: 17000, totalHourlyCost: 53722  },
    { code: 'EQ-PRY-15', name: 'Toyota SW4 - Todo Terreno',                    description: 'Año 2017',         powerHp: 170, newValue: 50750000,   amortPerHour: 5075,  repairsPerHour: 2538,  fuelPerHour: 32589, lubricantsPerHour: 17000, totalHourlyCost: 57202  },
    { code: 'EQ-PRY-16', name: 'Toyota Hilux 4x5 - Todo Terreno',              description: 'Año 2013',         powerHp: 170, newValue: 21750000,   amortPerHour: 2175,  repairsPerHour: 1088,  fuelPerHour: 32589, lubricantsPerHour: 17000, totalHourlyCost: 52852  },
    { code: 'EQ-PRY-17', name: 'Renault Kind Iconic - Automóvil',              description: 'Año 2018',         powerHp: 60,  newValue: 11600000,   amortPerHour: 1160,  repairsPerHour: 580,   fuelPerHour: 11502, lubricantsPerHour: 6000,  totalHourlyCost: 19242  },
    { code: 'EQ-PRY-18', name: 'Zampi Heli H2000 - Compresor',                 description: 'Año 2020',         powerHp: 60,  newValue: 36250000,   amortPerHour: 3625,  repairsPerHour: 1813,  fuelPerHour: 11502, lubricantsPerHour: 6000,  totalHourlyCost: 22940  },
    { code: 'EQ-PRY-19', name: 'John Deere - Cargadora',                       description: 'Año 2007',         powerHp: 150, newValue: 108750000,  amortPerHour: 10875, repairsPerHour: 5438,  fuelPerHour: 28755, lubricantsPerHour: 15000, totalHourlyCost: 60068  },
    { code: 'EQ-PRY-20', name: 'IVECO - Autohormigonero',                      description: 'Año 2017',         powerHp: 150, newValue: 113100000,  amortPerHour: 11310, repairsPerHour: 5655,  fuelPerHour: 28755, lubricantsPerHour: 15000, totalHourlyCost: 60720  },
    { code: 'EQ-PRY-21', name: 'New Holland - Cargadora (2013)',                description: 'Año 2013',         powerHp: 150, newValue: 50750000,   amortPerHour: 5075,  repairsPerHour: 2538,  fuelPerHour: 28755, lubricantsPerHour: 15000, totalHourlyCost: 51368  },
    { code: 'EQ-PRY-22', name: 'John Deere - Retroexcavadora 310',             description: 'Año 2014',         powerHp: 80,  newValue: 116000000,  amortPerHour: 11600, repairsPerHour: 5800,  fuelPerHour: 15336, lubricantsPerHour: 8000,  totalHourlyCost: 40736  },
    { code: 'EQ-PRY-23', name: 'Bob Cat - Rodillo Compactador Dinámico 1,20m', description: null,               powerHp: 80,  newValue: 36250000,   amortPerHour: 3625,  repairsPerHour: 1813,  fuelPerHour: 15336, lubricantsPerHour: 8000,  totalHourlyCost: 28774  },
    { code: 'EQ-PRY-24', name: 'Camión Motohormigonero',                       description: null,               powerHp: 260, newValue: 124700000,  amortPerHour: 12470, repairsPerHour: 6235,  fuelPerHour: 49842, lubricantsPerHour: 26000, totalHourlyCost: 94547  },
    { code: 'EQ-PRY-25', name: 'Vibrador de Inmersión',                        description: 'Motor a nafta',    powerHp: 5,   newValue: 1087500,    amortPerHour: 109,   repairsPerHour: 54,    fuelPerHour: 959,   lubricantsPerHour: 500,   totalHourlyCost: 1622   },
    { code: 'EQ-PRY-26', name: 'Compactador Manual',                           description: 'Motor a nafta',    powerHp: 7,   newValue: 10440000,   amortPerHour: 1044,  repairsPerHour: 522,   fuelPerHour: 1342,  lubricantsPerHour: 700,   totalHourlyCost: 3608   },
    { code: 'EQ-PRY-27', name: 'Grupo Electrógeno',                            description: null,               powerHp: 5,   newValue: 1500000,    amortPerHour: 150,   repairsPerHour: 75,    fuelPerHour: 959,   lubricantsPerHour: 500,   totalHourlyCost: 1684   },
  ];

  for (const eq of projectEquipment) {
    await prisma.equipmentCatalogItem.upsert({
      where: { code: eq.code },
      create: {
        code: eq.code,
        name: eq.name,
        description: eq.description,
        powerHp: eq.powerHp,
        newValue: eq.newValue,
        residualPct: 0.10,
        usefulLifeHours: 10000,
        amortPerHour: eq.amortPerHour,
        repairsPerHour: eq.repairsPerHour,
        fuelPerHour: eq.fuelPerHour,
        lubricantsPerHour: eq.lubricantsPerHour,
        totalHourlyCost: eq.totalHourlyCost,
        organizationId: org.id,
      },
      update: {
        name: eq.name,
        description: eq.description,
        powerHp: eq.powerHp,
        newValue: eq.newValue,
        amortPerHour: eq.amortPerHour,
        repairsPerHour: eq.repairsPerHour,
        fuelPerHour: eq.fuelPerHour,
        lubricantsPerHour: eq.lubricantsPerHour,
        totalHourlyCost: eq.totalHourlyCost,
      },
    });
    console.log(`   ✅ ${eq.code}: ${eq.name}`);
  }

  // ============================================================
  // RESUMEN
  // ============================================================
  const totalLaborCats = await prisma.laborCategory.count({ where: { organizationId: org.id } });
  const totalEquipment = await prisma.equipmentCatalogItem.count({ where: { organizationId: org.id } });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Importación completada:');
  console.log(`   • Categorías de Mano de Obra: ${totalLaborCats} (actualizadas con MMO Feb-26)`);
  console.log(`   • Equipos en catálogo: ${totalEquipment} total`);
  console.log(`     - 5 originales del seed`);
  console.log(`     - 33 catálogo genérico (EQ-GEN-XX)`);
  console.log(`     - 27 equipos del proyecto (EQ-PRY-XX)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
