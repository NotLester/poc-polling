import Link from 'next/link';

import NavActions from './NavActions';

const Navbar = () => {
  return (
    <nav className="w-full border-b-[0.5px] flex items-center justify-between py-5">
      <h1 className="text-2xl font-extrabold">
        <Link href="/">
          <span className="text-primary">PollApp</span>
        </Link>
      </h1>
      <NavActions />
    </nav>
  );
};

export default Navbar;
