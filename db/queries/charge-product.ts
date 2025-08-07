import { ChargeProductHashids } from "@/db/dto/charge-product.dto";
import { prisma } from "@/db/prisma";

import {
  OrderPhase,
  PaymentChannelType,
  type ChargeProductSelectDto,
} from "../type";

export async function getChargeProduct(locale?: string) {
  const data = await prisma.chargeProduct.findMany({
    where: {
      locale,
    },
    orderBy: {
      amount: "asc",
    },
  });

  return {
    data: (data.map(({ id, ...rest }) => ({
      ...rest,
      id: ChargeProductHashids.encode(id),
    })) ?? []) as ChargeProductSelectDto[],
  };
}
