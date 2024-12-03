import PrimaryButton from "./buttons/PrimaryButton";
import { minAddress } from "../utils/methods";
import { BTN_HEIGHT_IN_MAIN_AREA, BTN_WIDTH_IN_MAIN_AREA } from "../utils/constants";
import {
  Dialog,
  DialogHeader,
  DialogBody,
} from "@material-tailwind/react";
import { AiOutlineClose } from "react-icons/ai";
import { useEffect, useState } from "react";


export default function NavbarWithCTAButton({ className }) {


  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(!open);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);


  return (
    <div className={`${className && className} justify-end  `}>

      <PrimaryButton  className="py-1 text-sm md:py-2 md:text-base"
        onClick={() => handleOpen()}
      />
      <Dialog
        open={open}
        handler={handleOpen}
        animate={{
          mount: { scale: 1, y: 0 },
          unmount: { scale: 0.9, y: -100 },
        }}
        className="bg-custom-heavy-white border-[1px] border-gray-600 h-max "
      >
        <DialogHeader className="text-white flex justify-between">
          <div className=""> Connect wallet </div>
          <AiOutlineClose className="text-gray-500 hover:text-white cursor-pointer " onClick={() => handleOpen()} />
        </DialogHeader>
        <DialogBody className="w-full flex flex-col gap-6 rounded-3xl text-white items-center">

          
        </DialogBody>
      </Dialog>

    </div>
  );
}
