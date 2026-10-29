import { redirect } from "next/navigation";

/** A lista de aparelhos agora fica dentro de cada cômodo. */
export default function Aparelhos() {
  redirect("/casa/comodos");
}
